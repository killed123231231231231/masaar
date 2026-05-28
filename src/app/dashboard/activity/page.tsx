import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountActivity, parsePeriod } from "@/lib/analytics";
import { getMe } from "@/lib/me";
import ActivityClient from "./activity-client";

export const dynamic = "force-dynamic";

// B5/Fix 23 — account-wide scan feed. The Overview's RecentActivityTable
// used to show the 5 most-recent scans; this is the full paginated
// history with period filter + name search + CSV export.
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login=1&redirectTo=/dashboard/activity");

  const [activity, me] = await Promise.all([
    getAccountActivity(supabase, user.id, period, page, 50),
    getMe(user.id, user.email ?? ""),
  ]);

  return (
    <Suspense fallback={null}>
      <ActivityClient activity={activity} me={me} period={period} />
    </Suspense>
  );
}
