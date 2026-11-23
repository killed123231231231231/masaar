import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import DashboardFrame from "@/components/dashboard/frame";
import { planUsage } from "@/components/dashboard/nav";
import { Card, FOCUS, IconWell, PageTitle } from "@/components/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import SettingsClient from "./settings-client";

export const dynamic = "force-dynamic";

// B5/Item 12 — account settings (email + password change). The forms
// are client; this server page handles auth + Sidebar context (profile
// + qrCount for the `me` chip), same pattern as the other dashboard
// surfaces.
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const me = await getMe(user.id, user.email ?? "");
  const { limit, used, pct } = planUsage(me);

  return (
    <DashboardFrame me={me} current="settings" className="space-y-6">
      {/* Escape hatch back to the Overview (B5/Fix 18 pattern). */}
      <Link
        href="/dashboard"
        className={`inline-flex w-fit items-center gap-1.5 rounded-full font-body text-sm text-muted-2 hover:text-ink ${FOCUS}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to overview
      </Link>

      <PageTitle title="Settings" sub="Your email, password and plan." />

      <SettingsClient email={user.email ?? ""} />

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <IconWell icon={Gauge} tone="lime" />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-[17px] font-semibold text-ink">{me.plan} plan</h2>
            <p className="mt-0.5 font-body text-sm text-muted-2">
              <span className="tabular-nums text-ink">{used.toLocaleString()}</span> of{" "}
              {limit.toLocaleString()} QR codes used.
            </p>
            <div
              className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-stone"
              role="progressbar"
              aria-label="QR codes used"
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={used}
            >
              <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </Card>
    </DashboardFrame>
  );
}
