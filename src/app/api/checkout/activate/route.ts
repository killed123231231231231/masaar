import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Checkout stub. With PAYMENTS_ENABLED unset/false this directly
// activates the QR (no billing) — the whole point of the lock-in
// scaffold landing flag-off this session.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.PAYMENTS_ENABLED === "true") {
    // TODO(Sprint 3): create a Stripe Checkout session here, return its
    // URL, and move the qr_codes.status flip into the Stripe webhook
    // (checkout.session.completed). Do NOT activate before payment.
    return NextResponse.json(
      { error: "Payments not implemented yet." },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => null);
  const shortId = body?.short_id;
  if (typeof shortId !== "string") {
    return NextResponse.json({ error: "short_id required" }, { status: 400 });
  }

  // RLS (qr_codes_owner_all) scopes this to the caller's own row.
  const { data: updated, error } = await supabase
    .from("qr_codes")
    .update({ status: "active" })
    .eq("short_id", shortId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!updated) {
    return NextResponse.json(
      { error: "QR not found or not yours." },
      { status: 404 }
    );
  }

  // Best-effort subscription flag (profiles_self_update allows self).
  await supabase
    .from("profiles")
    .update({ subscription_status: "active" })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
