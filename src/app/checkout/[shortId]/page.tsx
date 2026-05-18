import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./checkout-client";

// Authed server component. Not under /dashboard, so middleware doesn't
// gate it — self-guard here. Ownership is enforced by RLS
// (qr_codes_owner_all): a non-owner's select returns no row.
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/checkout/${shortId}`);

  const { data: qr } = await supabase
    .from("qr_codes")
    .select(
      "id, short_id, name, status, kind, destination, fg_color, bg_color, gradient_color, dot_style, corner_style"
    )
    .eq("short_id", shortId)
    .maybeSingle();

  if (!qr) redirect("/dashboard");
  if (qr.status === "active") redirect("/dashboard?welcome=1");

  return (
    <CheckoutClient
      qr={qr}
      paymentsEnabled={process.env.PAYMENTS_ENABLED === "true"}
    />
  );
}
