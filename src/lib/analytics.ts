import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Single data source for the analytics page (per-QR + account-wide
// right-rail). Server-only, owner-RLS scoped.

export type Period = "7d" | "30d" | "90d" | "all";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

export function parsePeriod(raw: string | string[] | undefined): Period {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s === "7d" || s === "30d" || s === "90d" || s === "all") return s;
  return "30d";
}

const DAY_MS = 86_400_000;

/** Days for the period, or null for "all". */
export function periodDays(p: Period): number | null {
  return p === "7d" ? 7 : p === "30d" ? 30 : p === "90d" ? 90 : null;
}

/** ISO boundaries: [start, end) for current period and previous-equivalent. */
export function periodBounds(p: Period, now = new Date()) {
  const end = now.toISOString();
  const days = periodDays(p);
  if (!days) {
    return { startISO: new Date(0).toISOString(), endISO: end, prevStartISO: null, prevEndISO: null };
  }
  const start = new Date(now.getTime() - days * DAY_MS);
  const prevEnd = start;
  const prevStart = new Date(prevEnd.getTime() - days * DAY_MS);
  return {
    startISO: start.toISOString(),
    endISO: end,
    prevStartISO: prevStart.toISOString(),
    prevEndISO: prevEnd.toISOString(),
  };
}

// GMT+3 (Riyadh) day bucket — addresses the off-by-one gotcha #5.
function dayBucket(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

interface ScanRow {
  scanned_at: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_hash: string | null;
}

export interface Bucket {
  label: string;
  count: number;
}

export interface AnalyticsBundle {
  period: Period;
  qr: { id: string; name: string; kind: string; short_id: string | null; destination: string; status: string };

  // KPIs
  total: number;
  uniqueScanners: number;
  mobileShare: number;     // 0..100
  topCountry: string | null;
  topCity: string | null;

  // Trend deltas (percent change vs previous equivalent period)
  totalDeltaPct: number | null;
  uniqueDeltaPct: number | null;
  mobileDeltaPct: number | null;

  // Charts
  timeSeries: Bucket[];    // chronological
  byCountry: Bucket[];     // top 8
  byCity: Bucket[];        // top 8
  byDevice: Bucket[];      // donut
  byBrowser: Bucket[];     // top 6
  byOs: Bucket[];          // top 6

  // Tables / right rail
  recentScans: (ScanRow & { id: string })[];   // last 8 from the period
  userQrs: { id: string; name: string; short_id: string | null; scan_count: number }[];

  failedScansCount: number; // scans in period if QR is pending_payment / suspended
}

const ROW_FETCH_CAP = 50_000;

export async function getAnalytics(
  supabase: SupabaseClient<Database>,
  qrId: string,
  period: Period
): Promise<AnalyticsBundle | null> {
  // QR (owner-scoped via RLS)
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, name, kind, short_id, destination, status, user_id")
    .eq("id", qrId)
    .maybeSingle();
  if (!qr) return null;

  const { startISO, endISO, prevStartISO, prevEndISO } = periodBounds(period);

  // KPI totals via accurate count (fixes BACKLOG audit #4 — was capped at 5000).
  const baseCount = supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("qr_code_id", qrId);
  const totalQ = period === "all"
    ? baseCount
    : baseCount.gte("scanned_at", startISO).lte("scanned_at", endISO);
  const { count: totalCount } = await totalQ;
  const total = totalCount ?? 0;

  // Previous-period total for trend delta.
  let previousTotal = 0;
  if (prevStartISO && prevEndISO) {
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("qr_code_id", qrId)
      .gte("scanned_at", prevStartISO)
      .lt("scanned_at", prevEndISO);
    previousTotal = count ?? 0;
  }

  // Rows for charts/breakdowns (capped at 50k — flagged for very high
  // traffic; async export is Sprint 3+).
  const rowsQ = supabase
    .from("scans")
    .select("scanned_at, country, city, device_type, browser, os, ip_hash")
    .eq("qr_code_id", qrId)
    .order("scanned_at", { ascending: false })
    .limit(ROW_FETCH_CAP);
  const scopedRowsQ = period === "all"
    ? rowsQ
    : rowsQ.gte("scanned_at", startISO).lte("scanned_at", endISO);
  const { data: rowsRaw } = await scopedRowsQ;
  const rows = (rowsRaw ?? []) as ScanRow[];

  // Previous-period rows (lightweight — only need ip_hash + device_type)
  let prevRows: ScanRow[] = [];
  if (prevStartISO && prevEndISO) {
    const { data: prev } = await supabase
      .from("scans")
      .select("scanned_at, country, city, device_type, browser, os, ip_hash")
      .eq("qr_code_id", qrId)
      .gte("scanned_at", prevStartISO)
      .lt("scanned_at", prevEndISO)
      .limit(ROW_FETCH_CAP);
    prevRows = (prev ?? []) as ScanRow[];
  }

  const uniq = (xs: ScanRow[]) => new Set(xs.map((r) => r.ip_hash || "")).size;
  const mobileShareOf = (xs: ScanRow[]) => {
    if (xs.length === 0) return 0;
    const m = xs.filter((r) => (r.device_type || "").toLowerCase() === "mobile").length;
    return Math.round((m / xs.length) * 100);
  };

  const uniqueScanners = uniq(rows);
  const previousUnique = uniq(prevRows);
  const mobileShare = mobileShareOf(rows);
  const previousMobile = mobileShareOf(prevRows);

  const delta = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr === 0 ? 0 : null;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const totalDeltaPct = period === "all" ? null : delta(total, previousTotal);
  const uniqueDeltaPct = period === "all" ? null : delta(uniqueScanners, previousUnique);
  const mobileDeltaPct = period === "all" ? null : delta(mobileShare, previousMobile);

  // Group helper.
  const groupTop = (xs: ScanRow[], key: keyof ScanRow, n: number): Bucket[] => {
    const m = new Map<string, number>();
    for (const r of xs) {
      const v = (r[key] as string | null) || "Unknown";
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  };

  const byCountry = groupTop(rows, "country", 8);
  const byCity = groupTop(rows, "city", 8);
  const byDevice = groupTop(rows, "device_type", 6);
  const byBrowser = groupTop(rows, "browser", 6);
  const byOs = groupTop(rows, "os", 6);

  const topCountry = byCountry[0]?.label || null;
  const topCity = byCity[0]?.label || null;

  // Time series — bucket by Riyadh day.
  const buckets = new Map<string, number>();
  const days = periodDays(period);
  if (days) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS);
      buckets.set(dayBucket(d.toISOString()), 0);
    }
  }
  for (const r of rows) {
    const k = dayBucket(r.scanned_at);
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const timeSeries: Bucket[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({ label, count }));

  // Recent activity (8 most recent in period) — needs ids; fetch separately.
  const recentQ = supabase
    .from("scans")
    .select("id, scanned_at, country, city, device_type, browser, os, ip_hash")
    .eq("qr_code_id", qrId)
    .order("scanned_at", { ascending: false })
    .limit(8);
  const recentScoped = period === "all"
    ? recentQ
    : recentQ.gte("scanned_at", startISO).lte("scanned_at", endISO);
  const { data: recentRows } = await recentScoped;
  const recentScans = (recentRows ?? []).map((r) => ({
    ...(r as ScanRow),
    id: String((r as { id: number | string }).id),
  }));

  // Account-wide: user's QRs + per-QR scan counts (right rail / best-performing).
  const { data: myQrsRows } = await supabase
    .from("qr_codes")
    .select("id, name, short_id")
    .eq("user_id", qr.user_id as string)
    .order("created_at", { ascending: false })
    .limit(50);
  const myQrs = (myQrsRows ?? []) as { id: string; name: string; short_id: string | null }[];
  const ids = myQrs.map((q) => q.id);
  const countsMap: Record<string, number> = {};
  if (ids.length) {
    const { data: countsRows } = await supabase.rpc("scan_counts", { p_ids: ids });
    for (const c of countsRows ?? []) {
      countsMap[c.qr_code_id] = Number(c.count);
    }
  }
  const userQrs = myQrs
    .map((q) => ({ ...q, scan_count: countsMap[q.id] ?? 0 }))
    .sort((a, b) => b.scan_count - a.scan_count);

  const failedScansCount = qr.status === "pending_payment" || qr.status === "suspended" ? total : 0;

  return {
    period,
    qr: {
      id: qr.id,
      name: qr.name,
      kind: qr.kind,
      short_id: qr.short_id,
      destination: qr.destination,
      status: qr.status,
    },
    total,
    uniqueScanners,
    mobileShare,
    topCountry,
    topCity,
    totalDeltaPct,
    uniqueDeltaPct,
    mobileDeltaPct,
    timeSeries,
    byCountry,
    byCity,
    byDevice,
    byBrowser,
    byOs,
    recentScans,
    userQrs,
    failedScansCount,
  };
}

/* ────────────────────────── ACCOUNT-LEVEL ────────────────────────── */

export interface AccountRecentScan extends ScanRow {
  id: string;
  qr_id: string;
  qr_name: string;
  qr_short_id: string | null;
  /** B5/Fix 23 — optional, populated by getAccountActivity for the
   *  /dashboard/activity table; existing right-rail recentScans don't
   *  need it. */
  qr_destination?: string | null;
}

// B5/Item 10 — extended with the style fields needed to render the
// real QR thumbnail in the right rail + qr-codes grid (no more generic
// placeholder icon).
export interface AccountUserQr {
  id: string;
  name: string;
  short_id: string | null;
  status: string;
  scan_count: number;
  kind: string;
  destination: string;
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
  logo_url: string | null;
}

export interface AccountAnalyticsBundle {
  period: Period;

  // KPIs
  total: number;
  uniqueScanners: number;
  mobileShare: number;
  topCountry: string | null;
  activeQrCount: number;
  totalQrCount: number;

  // Deltas
  totalDeltaPct: number | null;
  uniqueDeltaPct: number | null;
  mobileDeltaPct: number | null;

  // Charts
  timeSeries: Bucket[];
  byCountry: Bucket[];
  byCity: Bucket[];
  byDevice: Bucket[];
  byBrowser: Bucket[];
  byOs: Bucket[];
  // B5/Item 11 — Saudi F&B fit: time-of-day donut to surface menu /
  // checkout peaks. Always 4 buckets, fixed order:
  // Morning (06–12) / Midday (12–17) / Evening (17–22) / Late night (22–06).
  byTimeOfDay: Bucket[];

  // Tables
  recentScans: AccountRecentScan[];
  userQrs: AccountUserQr[];

  // Conversion callout
  failedScansCount: number;
  firstPendingQrId: string | null;
  firstPendingQrShortId: string | null;
}

const EMPTY_ACCOUNT = (period: Period): AccountAnalyticsBundle => ({
  period,
  total: 0, uniqueScanners: 0, mobileShare: 0, topCountry: null,
  activeQrCount: 0, totalQrCount: 0,
  totalDeltaPct: null, uniqueDeltaPct: null, mobileDeltaPct: null,
  timeSeries: [], byCountry: [], byCity: [], byDevice: [], byBrowser: [], byOs: [],
  byTimeOfDay: [],
  recentScans: [], userQrs: [],
  failedScansCount: 0, firstPendingQrId: null, firstPendingQrShortId: null,
});

// B5/Item 11 — bucket a scan's Riyadh-local hour into one of four
// windows. Returns the bucket label (consistent ordering driven by the
// fixed enum below).
const TOD_BUCKETS = ["Morning", "Midday", "Evening", "Late night"] as const;
type TodBucket = (typeof TOD_BUCKETS)[number];

function timeOfDayBucket(iso: string): TodBucket {
  // 24-hour Riyadh wall-clock hour, integer 0–23.
  const hourStr = new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    hour12: false,
  });
  const h = parseInt(hourStr, 10);
  if (h >= 6 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Midday";
  if (h >= 17 && h < 22) return "Evening";
  return "Late night";
}

export async function getAccountAnalytics(
  supabase: SupabaseClient<Database>,
  userId: string,
  period: Period,
  /** B5/Round2 follow-up — when set, all scan queries scope to this
   *  single QR id (becomes a per-QR filtered view of Overview).
   *  userQrs still returns ALL of the user's QRs so the right-rail
   *  works as a between-QR navigator regardless of the filter. */
  filterQrId?: string | null
): Promise<AccountAnalyticsBundle> {
  // All of the user's QRs — including the style fields the right-rail
  // and qr-codes grid need to render real QR thumbnails (B5/Item 10).
  const { data: myQrs } = await supabase
    .from("qr_codes")
    .select("id, name, short_id, status, created_at, kind, destination, fg_color, bg_color, gradient_color, dot_style, corner_style, logo_url")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  type RawQr = {
    id: string;
    name: string;
    short_id: string | null;
    status: string;
    created_at: string;
    kind: string;
    destination: string;
    fg_color: string;
    bg_color: string;
    gradient_color: string | null;
    dot_style: string;
    corner_style: string;
    logo_url: string | null;
  };
  const qrs = (myQrs ?? []) as RawQr[];
  if (qrs.length === 0) return EMPTY_ACCOUNT(period);

  // ids drives every scan-query WHERE clause. With filterQrId, scopes
  // to the single QR (must belong to this user — already RLS-scoped
  // by the qr_codes SELECT above; if filterQrId isn't in the user's
  // list we treat it as "no filter" rather than 404 silently).
  const filtered = filterQrId
    ? qrs.find((q) => q.id === filterQrId)
    : null;
  const ids = filtered ? [filtered.id] : qrs.map((q) => q.id);
  const pendingIds = (filtered ? [filtered] : qrs)
    .filter((q) => q.status === "pending_payment" || q.status === "suspended")
    .map((q) => q.id);
  // activeQrCount / totalQrCount KPIs always reflect the ACCOUNT
  // totals regardless of filter — the "Active QR codes" tile is
  // account-wide context, not per-QR. Per-QR filtering applies only
  // to scan-derived KPIs (Total scans, Unique, Mobile share, etc.).
  const activeQrCount = qrs.filter((q) => q.status === "active").length;
  const totalQrCount = qrs.length;

  const { startISO, endISO, prevStartISO, prevEndISO } = periodBounds(period);

  // B5/Round2 C1 — parallelize every per-ids query via Promise.all.
  // Was: 7 sequential `await`s (~300ms each = ~2s nav transitions).
  // Now: max of the individual queries (~300-500ms).
  const totalQ = (() => {
    const q = supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .in("qr_code_id", ids);
    return period === "all" ? q : q.gte("scanned_at", startISO).lte("scanned_at", endISO);
  })();

  const prevTotalQ = prevStartISO && prevEndISO
    ? supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .in("qr_code_id", ids)
        .gte("scanned_at", prevStartISO)
        .lt("scanned_at", prevEndISO)
    : Promise.resolve({ count: 0 });

  const rowsQ = (() => {
    const q = supabase
      .from("scans")
      .select("scanned_at, country, city, device_type, browser, os, ip_hash")
      .in("qr_code_id", ids)
      .order("scanned_at", { ascending: false })
      .limit(ROW_FETCH_CAP);
    return period === "all" ? q : q.gte("scanned_at", startISO).lte("scanned_at", endISO);
  })();

  const prevRowsQ = prevStartISO && prevEndISO
    ? supabase
        .from("scans")
        .select("scanned_at, country, city, device_type, browser, os, ip_hash")
        .in("qr_code_id", ids)
        .gte("scanned_at", prevStartISO)
        .lt("scanned_at", prevEndISO)
        .limit(ROW_FETCH_CAP)
    : Promise.resolve({ data: [] as ScanRow[] });

  const recentQ = (() => {
    const q = supabase
      .from("scans")
      .select("id, scanned_at, country, city, device_type, browser, os, ip_hash, qr_codes(id, name, short_id)")
      .in("qr_code_id", ids)
      .order("scanned_at", { ascending: false })
      .limit(10);
    return period === "all" ? q : q.gte("scanned_at", startISO).lte("scanned_at", endISO);
  })();

  const failQ = pendingIds.length > 0
    ? (() => {
        const q = supabase
          .from("scans")
          .select("id", { count: "exact", head: true })
          .in("qr_code_id", pendingIds);
        return period === "all" ? q : q.gte("scanned_at", startISO).lte("scanned_at", endISO);
      })()
    : Promise.resolve({ count: 0 });

  // scan_counts feeds the right-rail "Your QRs" list — needs counts
  // for ALL user's QRs regardless of any active filter, so it always
  // gets the full id list (allIds), not the filtered `ids`.
  const allIds = qrs.map((q) => q.id);
  const countsRpc = supabase.rpc("scan_counts", { p_ids: allIds });

  // One round-trip wall, six queries in flight at once.
  const [
    { count: totalCount },
    { count: prevTotalCount },
    { data: rowsRaw },
    { data: prevRowsRaw },
    { data: recentRowsRaw },
    { count: failCount },
    { data: countsRows },
  ] = await Promise.all([
    totalQ,
    prevTotalQ,
    rowsQ,
    prevRowsQ,
    recentQ,
    failQ,
    countsRpc,
  ]);

  const total = totalCount ?? 0;
  const previousTotal = prevTotalCount ?? 0;
  const rows = (rowsRaw ?? []) as ScanRow[];
  const prevRows = (prevRowsRaw ?? []) as ScanRow[];

  const uniq = (xs: ScanRow[]) => new Set(xs.map((r) => r.ip_hash || "")).size;
  const mobileShareOf = (xs: ScanRow[]) => {
    if (xs.length === 0) return 0;
    const m = xs.filter((r) => (r.device_type || "").toLowerCase() === "mobile").length;
    return Math.round((m / xs.length) * 100);
  };
  const uniqueScanners = uniq(rows);
  const previousUnique = uniq(prevRows);
  const mobileShare = mobileShareOf(rows);
  const previousMobile = mobileShareOf(prevRows);

  const delta = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr === 0 ? 0 : null;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const totalDeltaPct = period === "all" ? null : delta(total, previousTotal);
  const uniqueDeltaPct = period === "all" ? null : delta(uniqueScanners, previousUnique);
  const mobileDeltaPct = period === "all" ? null : delta(mobileShare, previousMobile);

  const groupTop = (xs: ScanRow[], key: keyof ScanRow, n: number): Bucket[] => {
    const m = new Map<string, number>();
    for (const r of xs) {
      const v = (r[key] as string | null) || "Unknown";
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  };
  const byCountry = groupTop(rows, "country", 8);
  const byCity = groupTop(rows, "city", 8);
  const byDevice = groupTop(rows, "device_type", 6);
  const byBrowser = groupTop(rows, "browser", 6);
  const byOs = groupTop(rows, "os", 6);
  const topCountry = byCountry[0]?.label || null;

  // B5/Item 11 — time-of-day pattern (Riyadh wall clock, 4 fixed
  // buckets). Always returns all 4 in the canonical order so the donut
  // legend is stable across periods.
  const todCounts = new Map<TodBucket, number>();
  for (const b of TOD_BUCKETS) todCounts.set(b, 0);
  for (const r of rows) {
    const b = timeOfDayBucket(r.scanned_at);
    todCounts.set(b, (todCounts.get(b) ?? 0) + 1);
  }
  const byTimeOfDay: Bucket[] = TOD_BUCKETS.map((label) => ({
    label,
    count: todCounts.get(label) ?? 0,
  }));

  // Time series — Riyadh-day bucketed.
  const buckets = new Map<string, number>();
  const days = periodDays(period);
  if (days) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS);
      buckets.set(dayBucket(d.toISOString()), 0);
    }
  }
  for (const r of rows) {
    const k = dayBucket(r.scanned_at);
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const timeSeries: Bucket[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({ label, count }));

  // Recent scans + QR info — fetched in the parallel Promise.all above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentScans: AccountRecentScan[] = (recentRowsRaw ?? []).map((r: any) => {
    const q = Array.isArray(r.qr_codes) ? r.qr_codes[0] : r.qr_codes;
    return {
      id: String(r.id),
      qr_id: q?.id ?? "",
      qr_name: q?.name ?? "Unknown",
      qr_short_id: q?.short_id ?? null,
      scanned_at: r.scanned_at,
      country: r.country, city: r.city,
      device_type: r.device_type, browser: r.browser, os: r.os,
      ip_hash: r.ip_hash,
    };
  });

  // Best performing — scan_counts RPC already ran in the parallel batch.
  const countsMap: Record<string, number> = {};
  for (const c of countsRows ?? []) countsMap[c.qr_code_id] = Number(c.count);
  const userQrs: AccountUserQr[] = qrs
    .map((q) => ({
      id: q.id,
      name: q.name,
      short_id: q.short_id,
      status: q.status,
      scan_count: countsMap[q.id] ?? 0,
      kind: q.kind,
      destination: q.destination,
      fg_color: q.fg_color,
      bg_color: q.bg_color,
      gradient_color: q.gradient_color,
      dot_style: q.dot_style,
      corner_style: q.corner_style,
      logo_url: q.logo_url,
    }))
    .sort((a, b) => b.scan_count - a.scan_count);

  // Failed scans — failQ already ran in the parallel batch.
  let failedScansCount = 0;
  let firstPendingQrId: string | null = null;
  let firstPendingQrShortId: string | null = null;
  if (pendingIds.length > 0) {
    failedScansCount = failCount ?? 0;
    const firstPending = qrs.find((q) => q.id === pendingIds[0]);
    firstPendingQrId = firstPending?.id ?? null;
    firstPendingQrShortId = firstPending?.short_id ?? null;
  }

  return {
    period,
    total, uniqueScanners, mobileShare, topCountry,
    activeQrCount, totalQrCount,
    totalDeltaPct, uniqueDeltaPct, mobileDeltaPct,
    timeSeries, byCountry, byCity, byDevice, byBrowser, byOs, byTimeOfDay,
    recentScans, userQrs,
    failedScansCount, firstPendingQrId, firstPendingQrShortId,
  };
}

/* ────────────────────────── ACCOUNT ACTIVITY ──────────────────────────
 * B5/Fix 23 — paginated, period-scoped, account-wide scan feed for the
 * new /dashboard/activity page. Same RLS path as the per-QR analytics
 * (.in('qr_code_id', userQrIds) — RLS enforces ownership). Returns
 * count + hasMore so the page can paginate. */

export interface AccountActivityPage {
  scans: AccountRecentScan[];
  page: number;       // 1-based
  pageSize: number;
  hasMore: boolean;
  totalCount: number; // 0 when query couldn't count (treated same as empty)
}

export async function getAccountActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  period: Period,
  page: number = 1,
  pageSize: number = 50
): Promise<AccountActivityPage> {
  // User's QR ids first — same shape getAccountAnalytics uses.
  const { data: myQrs } = await supabase
    .from("qr_codes")
    .select("id")
    .eq("user_id", userId);
  const ids = (myQrs ?? []).map((q) => q.id as string);
  if (ids.length === 0) {
    return { scans: [], page, pageSize, hasMore: false, totalCount: 0 };
  }

  const { startISO, endISO } = periodBounds(period);

  // Accurate count via head:true (same fix as the BACKLOG #4 KPI cap).
  const countQ = supabase
    .from("scans")
    .select("id", { count: "exact", head: true })
    .in("qr_code_id", ids);
  const scopedCount = period === "all"
    ? countQ
    : countQ.gte("scanned_at", startISO).lte("scanned_at", endISO);
  const { count } = await scopedCount;
  const totalCount = count ?? 0;

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const rowsQ = supabase
    .from("scans")
    .select(
      "id, scanned_at, country, city, device_type, browser, os, ip_hash, " +
        "qr_codes(id, name, short_id, destination)"
    )
    .in("qr_code_id", ids)
    .order("scanned_at", { ascending: false })
    .range(from, to);
  const scopedRows = period === "all"
    ? rowsQ
    : rowsQ.gte("scanned_at", startISO).lte("scanned_at", endISO);
  const { data: rowsRaw } = await scopedRows;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scans: AccountRecentScan[] = (rowsRaw ?? []).map((r: any) => {
    const q = Array.isArray(r.qr_codes) ? r.qr_codes[0] : r.qr_codes;
    return {
      id: String(r.id),
      qr_id: q?.id ?? "",
      qr_name: q?.name ?? "Unknown",
      qr_short_id: q?.short_id ?? null,
      qr_destination: q?.destination ?? null,
      scanned_at: r.scanned_at,
      country: r.country,
      city: r.city,
      device_type: r.device_type,
      browser: r.browser,
      os: r.os,
      ip_hash: r.ip_hash,
    };
  });

  return {
    scans,
    page: safePage,
    pageSize,
    hasMore: totalCount > from + scans.length,
    totalCount,
  };
}
