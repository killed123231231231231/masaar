import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { signUnlock, unlockCookieName, UNLOCK_TTL_MS } from "@/lib/unlock-token";

export const runtime = "nodejs";

async function sha256_16(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

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
    .select("password_hash")
    .eq("short_id", shortId)
    .maybeSingle();
  if (!qr || !qr.password_hash) {
    return NextResponse.json({ error: "not_protected" }, { status: 404 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256_16(ip);

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

  const token = await signUnlock(shortId, Date.now());
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
