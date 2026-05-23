import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnalytics, parsePeriod } from "@/lib/analytics";
import { getMe } from "@/lib/me";
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

  const [bundle, me] = await Promise.all([
    getAnalytics(supabase, id, period),
    getMe(user.id, user.email ?? ""),
  ]);

  if (!bundle) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <AnalyticsClient bundle={bundle} me={me} />
    </Suspense>
  );
}
