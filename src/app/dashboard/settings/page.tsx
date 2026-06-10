import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import MobileDashboardNav from "@/components/dashboard/mobile-dashboard-nav";
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

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="settings" />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <MobileDashboardNav me={me} current="settings" />

          {/* Same escape-hatch pattern as the Edit-QR page (B5/Fix 18) — every
              dashboard subpage gets a clear way back without the sidebar. */}
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Account settings
            </h1>
            <p className="mt-1 text-sm text-charcoal/55">
              Update your email and password. Plan + billing controls land
              in Sprint 3.
            </p>
          </div>

          <SettingsClient email={user.email ?? ""} />
        </main>
      </div>
    </div>
  );
}
