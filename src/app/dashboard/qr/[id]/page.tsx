import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, MessageSquare } from "lucide-react";
import DashboardFrame from "@/components/dashboard/frame";
import { FOCUS, OUTLINE_BTN, PageTitle, SECONDARY_BTN } from "@/components/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import EditQrClient from "./edit-client";

export const dynamic = "force-dynamic";

// Edit a single QR. B5/Item 6 — uses the dashboard sidebar shell so the
// sidebar is on every authed surface (Overview, QR Codes, this edit page).
export default async function EditQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/?login=1&redirectTo=/dashboard/qr/${id}`);

  const [qrRes, me] = await Promise.all([
    supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    getMe(user.id, user.email ?? ""),
  ]);

  // PGRST116 = no rows: not found / not owned -> redirect. Anything else
  // (e.g. DB unavailable) is a real error and must not be swallowed.
  if (qrRes.error && qrRes.error.code !== "PGRST116") throw qrRes.error;
  const qr = qrRes.data;
  if (!qr) redirect("/dashboard");

  return (
    <DashboardFrame me={me} current="qrcodes" className="space-y-6">
      {/* B5/Fix 18 — clear way back to the QR list without the sidebar. */}
      <Link
        href="/dashboard/qr-codes"
        className={`inline-flex w-fit items-center gap-1.5 rounded-full font-body text-sm text-muted-2 hover:text-ink ${FOCUS}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to QR codes
      </Link>

      <PageTitle
        title={<>Edit “{qr.name}”</>}
        sub={
          <span className="capitalize">
            {qr.kind} · {qr.content_kind.replace(/_/g, " ")}
            {qr.short_id ? ` · /r/${qr.short_id}` : ""}
          </span>
        }
        right={
          <>
            {qr.content_kind === "feedback" && (
              <Link href={`/dashboard/qr/${qr.id}/feedback`} className={OUTLINE_BTN}>
                <MessageSquare className="h-4 w-4" aria-hidden /> View feedback
              </Link>
            )}
            <Link href={`/dashboard?qr=${qr.id}`} className={SECONDARY_BTN}>
              <BarChart3 className="h-4 w-4" aria-hidden /> View analytics
            </Link>
          </>
        }
      />

      <EditQrClient initial={qr} />
    </DashboardFrame>
  );
}
