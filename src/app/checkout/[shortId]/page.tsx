import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CheckoutClient from "./checkout-client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLS =
  "id, short_id, name, status, kind, destination, fg_color, bg_color, gradient_color, dot_style, corner_style, creator_email";

// Authed: RLS-scoped ownership (unchanged). Anon (A.7): a valid
// draft_token + email combo renders the same UI; Pay → /api/checkout/anon.
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ shortId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shortId } = await params;
  const sp = await searchParams;
  const draftToken = typeof sp.draft_token === "string" ? sp.draft_token : "";
  const email =
    typeof sp.email === "string" ? sp.email.trim().toLowerCase() : "";
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: qr } = await supabase
      .from("qr_codes")
      .select(COLS)
      .eq("short_id", shortId)
      .maybeSingle();
    if (!qr) redirect("/dashboard");
    if (qr.status === "active") redirect("/dashboard?welcome=1");
    return (
      <CheckoutClient qr={qr} paymentsEnabled={paymentsEnabled} anon={null} />
    );
  }

  // Anonymous: require a valid draft_token + email.
  if (!UUID.test(draftToken) || !email) redirect("/");

  const admin = (() => {
    try {
      return createAdminClient();
    } catch {
      return null;
    }
  })();
  if (!admin) redirect("/");

  const { data: rows } = await admin
    .from("qr_codes")
    .select(COLS)
    .eq("draft_token", draftToken)
    .is("user_id", null);
  if (!rows || rows.length === 0) redirect("/");

  // Prefer the row whose short_id matches the URL; else the first draft.
  const qr = rows.find((r) => r.short_id === shortId) ?? rows[0];
  // If an email is already held it must match (defense-in-depth);
  // unset is fine — the anon-checkout API binds it on claim.
  if (qr.creator_email && qr.creator_email.toLowerCase() !== email) {
    redirect("/");
  }
  if (qr.status === "active") redirect("/dashboard?welcome=1");

  return (
    <CheckoutClient
      qr={qr}
      paymentsEnabled={paymentsEnabled}
      anon={{ draftToken, email }}
    />
  );
}
