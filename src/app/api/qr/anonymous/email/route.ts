import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";

// Holds the email on the anon draft QR row(s) so the (unauth) checkout
// page can verify the ?email param against the row. Admin client —
// anon draft rows (user_id NULL) aren't writable under RLS. Node.
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  if (!(await rateLimit("anon_email_ip", await hashRequestIp(request), 10, 3600)).ok) {
    return rateLimitedResponse();
  }
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const draftToken = String(body?.draft_token || "");

  if (!EMAIL.test(email))
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (!UUID.test(draftToken))
    return NextResponse.json({ error: "invalid_draft" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { error } = await admin
    .from("qr_codes")
    .update({ creator_email: email })
    .eq("draft_token", draftToken)
    .is("user_id", null);

  if (error) {
    console.error("[anon email]", error.message);
    return NextResponse.json({ error: "save_failed", message: "Couldn’t save your email. Please retry." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
