import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LockScreen from "@/components/lock-screen";

// Server-rendered (no client fetch flicker), no auth required. Reads
// status via the anon-granted resolve_qr_v2 SECURITY DEFINER RPC —
// qr_codes itself has no public read policy.
export default async function ActivatePage({
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

  // Keep URLs coherent if someone lands here for a QR that isn't pending.
  if (qr.status === "active") {
    // Hand back to the scan route so the password gate and every other
    // check apply; never jump straight to the raw destination from here.
    redirect(`/r/${shortId}`);
  }
  if (qr.status === "suspended") redirect(`/expired/${shortId}`);

  return <LockScreen variant="activate" shortId={shortId} />;
}
