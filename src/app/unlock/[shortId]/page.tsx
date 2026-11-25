import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { qrTarget } from "@/lib/qr-target";
import { verifyUnlock, unlockCookieName } from "@/lib/unlock-token";
import UnlockForm from "./unlock-form";

// Session I — password gate. /r (edge) sends protected QRs here. This node
// page reads the unlock cookie; if valid, it redirects onward to the real
// target — otherwise it renders the password form.
export const dynamic = "force-dynamic";

interface Row {
  name: string;
  kind: string;
  status: string;
  content_kind: string;
  destination: string;
  password_hash: string | null;
}

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select("name, kind, status, content_kind, destination, password_hash")
    .eq("short_id", shortId)
    .maybeSingle();
  const qr = data as Row | null;
  // Static QRs encode their content directly and never resolve here.
  if (!qr || qr.kind !== "dynamic") notFound();

  // Status FIRST, before any redirect to the target: a suspended (e.g.
  // admin-locked) QR must never resolve through /unlock, password or not.
  if (qr.status === "suspended") redirect(`/expired/${shortId}`);
  if (qr.status !== "active") redirect(`/activate/${shortId}`);

  const target = qrTarget(shortId, qr.content_kind, qr.destination);

  // Not actually protected → straight to the target (defensive).
  if (!qr.password_hash) {
    if (!target) notFound();
    redirect(target);
  }

  const jar = await cookies();
  const token = jar.get(unlockCookieName(shortId))?.value;
  if (await verifyUnlock(token, shortId, Date.now(), qr.password_hash)) {
    if (!target) notFound();
    redirect(target);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper font-body text-ink px-4 py-10">
      <UnlockForm shortId={shortId} name={qr.name} />
    </main>
  );
}
