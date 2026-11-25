import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LockScreen from "@/components/lock-screen";

// Server-rendered, no auth. "This QR is no longer active." No CTA.
export default async function ExpiredPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_qr_v2", {
    p_short_id: shortId,
  });
  const qr = Array.isArray(data) ? data[0] : null;

  if (error || !qr || qr.status === "draft") notFound();

  if (qr.status === "active") {
    // Hand back to the scan route so the password gate and every other
    // check apply; never jump straight to the raw destination from here.
    redirect(`/r/${shortId}`);
  }
  if (qr.status === "pending_payment") redirect(`/activate/${shortId}`);

  return <LockScreen variant="expired" shortId={shortId} />;
}
