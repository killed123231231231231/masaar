import type { Bucket, Period } from "@/lib/analytics";

// Pure helpers for the "Scan trend over time" chart. The analytics bundle
// returns one bucket per Riyadh day ("YYYY-MM-DD"); long ranges read better
// grouped by week or month, so the grouping happens here on the client.

export type Granularity = "day" | "week" | "month";

export const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" to a UTC midnight timestamp (pure date maths, no zone shift). */
function dayMs(key: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function keyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function dayLabel(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function pickGranularity(period: Period, days: number): Granularity {
  if (period === "7d" || period === "30d") return "day";
  if (period === "90d") return "week";
  if (days <= 45) return "day";
  if (days <= 200) return "week";
  return "month";
}

export interface TrendPoint {
  /** Axis label, e.g. "Nov 17" or "Nov 2026". */
  date: string;
  /** Tooltip label, e.g. "Week of Nov 17". */
  full: string;
  count: number;
}

/**
 * Zero-fills gaps between the first and last day, then groups by the
 * granularity that suits the period. Unparseable keys are dropped.
 */
export function bucketTrend(series: Bucket[], period: Period): { granularity: Granularity; points: TrendPoint[] } {
  const counts = new Map<number, number>();
  for (const b of series) {
    const ms = dayMs(b.label);
    if (ms === null) continue;
    counts.set(ms, (counts.get(ms) ?? 0) + b.count);
  }
  if (counts.size === 0) return { granularity: "day", points: [] };

  const keys = Array.from(counts.keys()).sort((a, b) => a - b);
  const first = keys[0];
  const last = keys[keys.length - 1];
  const days = Math.round((last - first) / DAY_MS) + 1;
  const granularity = pickGranularity(period, days);

  const groups = new Map<string, TrendPoint>();
  for (let ms = first; ms <= last; ms += DAY_MS) {
    const n = counts.get(ms) ?? 0;
    const d = new Date(ms);
    let gKey: string;
    let date: string;
    let full: string;
    if (granularity === "day") {
      gKey = keyOf(ms);
      date = dayLabel(ms);
      full = date;
    } else if (granularity === "week") {
      // ISO week, Monday start.
      const monday = ms - ((d.getUTCDay() + 6) % 7) * DAY_MS;
      gKey = keyOf(monday);
      date = dayLabel(monday);
      full = `Week of ${date}`;
    } else {
      gKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      date = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      full = date;
    }
    const g = groups.get(gKey);
    if (g) g.count += n;
    else groups.set(gKey, { date, full, count: n });
  }
  return { granularity, points: Array.from(groups.values()) };
}
