import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseHttpUrl } from "@/lib/url";
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
    const target = parseHttpUrl(qr.destination);
    redirect(target ? target.toString() : "/");
  }
  if (qr.status === "pending_payment") redirect(`/activate/${shortId}`);

  return <LockScreen variant="expired" shortId={shortId} />;
}
