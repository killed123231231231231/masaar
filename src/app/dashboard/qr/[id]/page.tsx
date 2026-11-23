import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart3, MessageSquare } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import MobileDashboardNav from "@/components/dashboard/mobile-dashboard-nav";
import LogoMark from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import EditQrClient from "./edit-client";

export const dynamic = "force-dynamic";

const pillCls =
  "inline-flex w-fit items-center gap-1.5 rounded-full bg-stone px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30";

// Edit a single QR. B5/Item 6 — migrated off the legacy DashboardShell
// onto the new deep-teal Sidebar shell so the sidebar is locked on every
// authed surface (Overview, Analytics, QR Codes, this edit page).
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
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="flex">
        <Sidebar
          me={me}
          current="qrcodes"
          analyticsHref={`/dashboard?qr=${qr.id}`}
        />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <MobileDashboardNav me={me} current="qrcodes" />

          {/* B5/Fix 18 — Back button above the page header so the
              user has a clear escape back to the QR list without
              hunting through the sidebar. Matches the brand outlined
              button family ("View analytics" right next door). */}
          <Link
            href="/dashboard/qr-codes"
            className={pillCls}
          >
            <ArrowLeft className="h-4 w-4" /> Back to QR codes
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-[28px] font-medium leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">
                Edit “{qr.name}”
              </h1>
              <p className="mt-1.5 text-sm capitalize text-muted-2">
                {qr.kind} · {qr.content_kind}
                {qr.short_id ? ` · /r/${qr.short_id}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {qr.content_kind === "feedback" && (
                <Link
                  href={`/dashboard/qr/${qr.id}/feedback`}
                  className={pillCls}
                >
                  <MessageSquare className="h-4 w-4" /> View feedback
                </Link>
              )}
              <Link
                href={`/dashboard?qr=${qr.id}`}
                className={pillCls}
              >
                <BarChart3 className="h-4 w-4" /> View analytics
              </Link>
            </div>
          </div>

          <EditQrClient initial={qr} />
        </main>
      </div>
    </div>
  );
}
