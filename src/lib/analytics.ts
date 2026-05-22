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
