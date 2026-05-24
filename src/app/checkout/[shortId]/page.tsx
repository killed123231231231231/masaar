import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CheckoutClient from "./checkout-client";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// B5/Round2 Item 6 — logo_url added so the checkout-page QR preview
// renders the user's logo BEFORE they pay (critical trust moment;
// previously they only saw their logo on the activated /render.png
// after payment, which is too late). QrPreview accepts `logoUrl` and
// composites it client-side via qr-code-styling.
const COLS =
  "id, short_id, name, status, kind, destination, fg_color, bg_color, gradient_color, dot_style, corner_style, logo_url, creator_email";

// Social proof: count of QRs created in the last 24h, account-wide.
// Uses the admin client since RLS scopes regular queries to the owner.
// Returns null on any failure (missing service role, network error) so the
// client falls back to "Be among the first" instead of fabricating a number.
async function recentQrCount(): Promise<number | null> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await admin
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

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
    const [qrRes, socialProof] = await Promise.all([
      supabase
        .from("qr_codes")
        .select(COLS)
        .eq("short_id", shortId)
        .maybeSingle(),
      recentQrCount(),
    ]);
    const qr = qrRes.data;
    if (!qr) redirect("/dashboard");
    if (qr.status === "active") redirect("/dashboard?welcome=1");
    return (
      <CheckoutClient
        qr={qr}
        paymentsEnabled={paymentsEnabled}
        anon={null}
        socialProofCount={socialProof}
      />
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

  const socialProof = await recentQrCount();

  return (
    <CheckoutClient
      qr={qr}
      paymentsEnabled={paymentsEnabled}
      anon={{ draftToken, email }}
      socialProofCount={socialProof}
    />
  );
}
