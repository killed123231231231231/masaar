import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContactNotification } from "@/lib/email";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";

export const runtime = "nodejs";


// Receives the /contact form, validates, hashes the IP, hands off to the
// submit_contact_request SECURITY DEFINER RPC (which enforces a 3/hr per
// IP rate limit), then fires a Resend notification to hello@masaar.sa.
// Email failure does NOT fail the request — the row is already saved,
// and we'd rather degrade silently than 500 on the user.
export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    preferred_time?: string;
  } | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const phone = (body?.phone ?? "").trim();
  const message = (body?.message ?? "").trim();
  const preferredTime = (body?.preferred_time ?? "").trim();

  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!message) return NextResponse.json({ error: "message_required" }, { status: 400 });

  // Lengths — defense-in-depth.
  if (name.length > 200 || email.length > 320 || message.length > 5000 ||
      phone.length > 50 || preferredTime.length > 200) {
    return NextResponse.json({ error: "field_too_long" }, { status: 400 });
  }

  const ipHash = await hashRequestIp(request);

  // Service role: migration 031 revokes anon execute on this limiter so a
  // caller can't rotate p_ip_hash. The hash is computed server-side above.
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const { error } = await supabase.rpc("submit_contact_request", {
    p_name: name,
    p_email: email,
    p_phone: phone || null,
    p_message: message,
    p_preferred_time: preferredTime || null,
    p_ip_hash: ipHash,
  });
  if (error) {
    if (error.message?.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        { error: "rate_limit_exceeded", message: "Too many requests from your network. Try again in an hour." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: error.message ?? "submit_failed" }, { status: 400 });
  }

  // Fire-and-forget the notification email. Surface delivery problems
  // to logs but never fail the request — the row is committed.
  try {
    const result = await sendContactNotification({
      name,
      email,
      phone: phone || null,
      message,
      preferredTime: preferredTime || null,
    });
    if (!result.sent && !result.stubbed) {
      console.warn(`[contact] notification email failed: ${result.error}`);
    }
  } catch (e) {
    console.warn(`[contact] notification email crashed: ${String(e)}`);
  }

  return NextResponse.json({ ok: true });
}
