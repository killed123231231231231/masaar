import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, name, kind, short_id, destination")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!qr) redirect("/dashboard");

  // Pull last 5,000 scans — plenty for v1 charts.
  const { data: scans } = await supabase
    .from("scans")
    .select("scanned_at, country, city, device_type, browser, os")
    .eq("qr_code_id", id)
    .order("scanned_at", { ascending: false })
    .limit(5000);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics — {qr.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {scans?.length ?? 0} total scans · {qr.kind === "dynamic" ? `/r/${qr.short_id}` : "static QR"}
        </p>
      </div>
      <AnalyticsClient scans={scans ?? []} />
    </DashboardShell>
  );
}
