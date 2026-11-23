import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";

export const runtime = "nodejs";

// Session D — Payment-placeholder waitlist capture. waitlist_signups has
// no client-write policy, so the insert goes through the service role.
export async function POST(request: Request) {
  if (!(await rateLimit("waitlist_ip", await hashRequestIp(request), 5, 3600)).ok) {
    return rateLimitedResponse();
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const source = typeof body?.source === "string" ? body.source.slice(0, 50) : "payment_qr";

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  // Dedupe: waitlist_signups has no unique constraint on email, so check
  // first. Same "ok" response either way (no account-existence oracle).
  const { data: existing } = await admin
    .from("waitlist_signups")
    .select("id")
    // Case-insensitive exact match: escape LIKE wildcards in the address.
    .ilike("email", email.replace(/[\\%_]/g, (c: string) => `\\${c}`))
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true });

  const { error } = await admin.from("waitlist_signups").insert({ email, source });
  if (error) return NextResponse.json({ error: "failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
