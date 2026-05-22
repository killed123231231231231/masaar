import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnalytics, parsePeriod } from "@/lib/analytics";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const period = parsePeriod(sp.period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [bundle, profileRes, qrCountRes] = await Promise.all([
    getAnalytics(supabase, id, period),
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

  if (!bundle) redirect("/dashboard");

  const me = {
    email: user.email ?? "",
    name: profileRes.data?.full_name ?? user.email ?? "Account",
    plan: profileRes.data?.subscription_status === "active" ? "Pro" : "Free",
    qrCount: qrCountRes.count ?? 0,
  };

  return (
    <Suspense fallback={null}>
      <AnalyticsClient bundle={bundle} me={me} />
    </Suspense>
  );
}
