import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/sidebar";
import LogoMark from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/server";
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

  const [profileRes, qrCountRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, subscription_status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const me = {
    email: user.email ?? "",
    name: profileRes.data?.full_name ?? user.email ?? "Account",
    plan: profileRes.data?.subscription_status === "active" ? "Pro" : "Free",
    qrCount: qrCountRes.count ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="none" />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          {/* Mobile top bar — same pattern as the other surfaces. */}
          <div className="flex items-center justify-between lg:hidden">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/65 hover:text-deep-teal"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-deep-teal p-1">
                <LogoMark className="h-full w-full brightness-0 invert" />
              </span>
              Dashboard
            </Link>
            <span className="text-xs text-charcoal/45">Settings</span>
          </div>

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
