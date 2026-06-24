import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountAnalyticsCached, parsePeriod, riyadhDayKey } from "@/lib/analytics";
import { getMe } from "@/lib/me";
import OverviewClient from "./overview-client";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Account-level Overview with optional per-QR filter (B5/Round2
// post-merge follow-up). When ?qr=<uuid> is present, every scan-
// derived widget scopes to that single QR; the right rail still
// lists all QRs so the user can switch between them in place. URL
// is the source of truth — back/forward preserves the filter,
// bookmarks work, refresh stays put.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const rawQr = Array.isArray(sp.qr) ? sp.qr[0] : sp.qr;
  // Only honor if it parses as a UUID. Invalid / unknown ids are
  // silently dropped (getAccountAnalytics also defends against
  // unknown-id-for-this-user by treating it as no filter).
  const filterQrId = rawQr && UUID.test(rawQr) ? rawQr : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login=1&redirectTo=/dashboard");

  const [bundle, me] = await Promise.all([
    // riyadhDayKey() joins the cache key so the cache busts at the Riyadh
    // midnight boundary — no more stale yesterday-range on the first load
    // of a new day.
    getAccountAnalyticsCached(user.id, period, filterQrId, riyadhDayKey()),
    getMe(user.id, user.email ?? ""),
  ]);

  // Resolve the filtered QR's display name from the bundle's userQrs
  // (already loaded, no extra query). Falls back to null if the id
  // wasn't found in the user's list — OverviewClient treats null as
  // "no filter active" for the chip rendering.
  const filteredQr = filterQrId
    ? bundle.userQrs.find((q) => q.id === filterQrId) ?? null
    : null;

  return (
    <Suspense fallback={null}>
      <OverviewClient
        bundle={bundle}
        me={me}
        filterQrId={filteredQr?.id ?? null}
        filterQrName={filteredQr?.name ?? null}
      />
    </Suspense>
  );
}
