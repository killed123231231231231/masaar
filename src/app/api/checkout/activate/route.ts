import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { qrCacheDelete } from "@/lib/qr-edge-cache";

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

  // Service-role write (direct browser writes are revoked in migration
  // 032), pinned to the caller's own row that is genuinely waiting to be
  // activated. Never flips a suspended or admin-locked QR back on.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  const { data: updated, error } = await admin
    .from("qr_codes")
    .update({ status: "active" })
    .eq("short_id", shortId)
    .eq("user_id", user.id)
    .eq("status", "pending_payment")
    .eq("admin_locked", false)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[checkout activate]", error.message);
    return NextResponse.json({ error: "Couldn’t activate the QR code. Please try again." }, { status: 400 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: "QR not found or not yours." },
      { status: 404 }
    );
  }

  // Any cached "pending" copy must not linger now the QR is live.
  await qrCacheDelete(shortId).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
