import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { signUnlock, unlockCookieName, UNLOCK_TTL_MS } from "@/lib/unlock-token";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";


export async function POST(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return NextResponse.json({ error: "missing" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { data: qr } = await admin
    .from("qr_codes")
    .select("password_hash, status")
    .eq("short_id", shortId)
    .maybeSingle();
  if (!qr || !qr.password_hash || qr.status !== "active") {
    return NextResponse.json({ error: "not_protected" }, { status: 404 });
  }

  const ipHash = await hashRequestIp(request);

  // Atomic attempt budget BEFORE the bcrypt check (hit_rate_limit takes an
  // advisory lock, so a parallel burst can't all slip under the limit the
  // way count-then-insert allowed): 5 tries per (QR, network) per 15 min,
  // and 30 per QR per hour from all networks combined (stops IP rotation).
  const [perIp, perQr] = await Promise.all([
    rateLimit("unlock_ip", `${shortId}:${ipHash}`, 5, 900),
    rateLimit("unlock_qr", shortId, 30, 3600),
  ]);
  if (!perIp.ok || !perQr.ok) {
    return NextResponse.json({ error: "locked" }, { status: 429 });
  }

  // Lockout: 5 wrong attempts per (shortId, ip) in 15 minutes.
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("unlock_attempts")
    .select("*", { count: "exact", head: true })
    .eq("short_id", shortId)
    .eq("ip_hash", ipHash)
    .eq("ok", false)
    .gte("attempted_at", since);
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "locked" }, { status: 429 });
  }

  const ok = await bcrypt.compare(password, qr.password_hash as string);
  await admin.from("unlock_attempts").insert({ short_id: shortId, ip_hash: ipHash, ok });
  if (!ok) return NextResponse.json({ error: "wrong" }, { status: 401 });

  const token = await signUnlock(shortId, Date.now(), qr.password_hash as string);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(unlockCookieName(shortId), token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(UNLOCK_TTL_MS / 1000),
  });
  return res;
}
