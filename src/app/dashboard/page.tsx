import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountAnalytics, parsePeriod } from "@/lib/analytics";
import { getMe } from "@/lib/me";
import OverviewClient from "./overview-client";

export const dynamic = "force-dynamic";

// Account-level Overview — the new /dashboard home. The per-QR grid has
// moved to /dashboard/qr-codes. Per-QR drill-down still lives at
// /dashboard/qr/<id>/analytics.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [bundle, me] = await Promise.all([
    getAccountAnalytics(supabase, user.id, period),
    getMe(user.id, user.email ?? ""),
  ]);

  return (
    <Suspense fallback={null}>
      <OverviewClient bundle={bundle} me={me} />
    </Suspense>
  );
}
