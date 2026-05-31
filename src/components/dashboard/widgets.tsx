"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, QrCode, type LucideIcon } from "lucide-react";
import { PERIODS, type Bucket, type Period } from "@/lib/analytics";

// Single brand chart palette — used by donut + cells.
export const PALETTE = ["#0F5B55", "#E07A5F", "#3FA39A", "#073d3a", "#B85F47", "#D6D1C6"];

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

/* ────────────────────────── PERIOD PILLS ────────────────────────── */

export function PeriodPills({ current }: { current: Period }) {
  const router = useRouter();
  const params = useSearchParams();
  function set(p: Period) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("period", p);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => {
        const active = p.id === current;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => set(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-deep-teal text-white"
                : "border border-charcoal/15 text-charcoal/65 hover:bg-sand-light"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────── KPI ────────────────────────── */

export type KpiTint =
  | "deep-teal" | "terracotta" | "sea-teal" | "deep-teal-dark" | "terracotta-dark";

const TINT_BG: Record<KpiTint, string> = {
  "deep-teal": "bg-deep-teal/10 text-deep-teal",
  "terracotta": "bg-terracotta/15 text-terracotta-dark",
  "sea-teal": "bg-[#3FA39A]/15 text-[#3FA39A]",
  "deep-teal-dark": "bg-deep-teal-dark/10 text-deep-teal-dark",
  "terracotta-dark": "bg-terracotta-dark/15 text-terracotta-dark",
};

export function KpiCard({
  icon: Icon, tint, label, value, delta, series,
}: {
  icon: LucideIcon;
  tint: KpiTint;
  label: string;
  value: string;
  delta?: number | null;
  series?: Bucket[];
}) {
  // B5/Item 5 — bumped padding + softer 2-layer shadow so adjacent cards
  // feel clearly distinct on the cream page background instead of merging.
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <div className="flex items-start justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${TINT_BG[tint]}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {series && series.length > 0 && <Sparkline series={series} />}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-charcoal/45">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-bold leading-tight">{value}</p>
      {delta != null && <Delta pct={delta} />}
    </div>
  );
}

export function Delta({ pct }: { pct: number }) {
  const positive = pct >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-deep-teal" : "text-terracotta-dark"}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}% vs previous
    </p>
  );
}

export function Sparkline({ series }: { series: Bucket[] }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const w = 70, h = 24;
  const stepX = series.length > 1 ? w / (series.length - 1) : w;
  const points = series.map((s, i) => `${i * stepX},${h - (s.count / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-[70px]" aria-hidden>
      <polyline points={points} fill="none" stroke="#0F5B55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ────────────────────────── CHARTS ────────────────────────── */

export function TrendCard({ period, series }: { period: Period; series: Bucket[] }) {
  const data = series.map((b) => ({ date: b.label.slice(5), count: b.count }));
  const hasData = data.some((d) => d.count > 0);
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
          Scan trend over time
        </h2>
        <span className="text-xs text-charcoal/45">
          {PERIODS.find((p) => p.id === period)?.label}
        </span>
      </div>
      <div className="mt-4 h-72 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F5B55" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0F5B55" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#1B1B1D88" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              {/* B5/Item 8 — Y-axis with integer ticks so scan counts are
                  legible. allowDecimals=false keeps "0/1/2/3..." instead
                  of "0.5". Width=32 reserves the gutter; left margin
                  pulled in to compensate. */}
              <YAxis
                tick={{ fontSize: 11, fill: "#1B1B1D88" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip cursor={{ stroke: "#0F5B55", strokeDasharray: "3 3" }} content={<TrendTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#0F5B55" strokeWidth={2.5} fill="url(#trendG)" dot={{ r: 2, fill: "#0F5B55" }} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

// B5/Item 8 — branded trend-chart tooltip. Recharts hands us
// (label, payload[]) for AreaChart hover; we render the day label and
// "Total scans: N" with the deep-teal accent.
function TrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string }[];
}) {
  if (!active || !payload?.length) return null;
  const count = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <p className="text-[10px] uppercase tracking-wider text-charcoal/45">{label}</p>
      <p className="mt-0.5 text-xs">
        <span className="text-charcoal/65">Total scans:</span>{" "}
        <span className="font-display text-sm font-bold text-deep-teal">
          {count.toLocaleString()}
        </span>
      </p>
    </div>
  );
}

export function EmptyChart() {
  return (
    <div className="grid h-full place-items-center text-center text-sm text-charcoal/45">
      <div>
        <QrCode className="mx-auto h-10 w-10 text-charcoal/20" />
        <p className="mt-2 font-semibold text-charcoal/55">No scans yet</p>
        <p className="mt-1 text-xs">Once someone scans this QR, you’ll see real-time analytics here.</p>
      </div>
    </div>
  );
}

export function DonutCard({
  title, series, centerLabel,
}: { title: string; series: Bucket[]; centerLabel: string }) {
  const total = series.reduce((s, b) => s + b.count, 0);
  const data = series.length ? series : [{ label: "No data", count: 1 }];
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">{title}</h2>
      <div className="mt-3 grid grid-cols-[140px_1fr] items-center gap-4">
        {/* outline-none on focus kills the ugly square focus box recharts'
            Pie sectors show when clicked/focused (applies to both donuts). */}
        <div className="relative h-[140px] w-[140px] [&_:focus]:outline-none [&_:focus-visible]:outline-none [&_svg]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={65} strokeWidth={0} rootTabIndex={-1}>
                {data.map((_, i) => (
                  <Cell key={i} fill={series.length ? PALETTE[i % PALETTE.length] : "#E9E6DF"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="font-display text-lg font-bold leading-none">{total}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-charcoal/45">{centerLabel}</p>
            </div>
          </div>
        </div>
        <ul className="space-y-1.5 text-xs">
          {(series.length ? series : []).map((b, i) => (
            <li key={b.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate capitalize text-charcoal/70">{b.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-charcoal">
                {b.count} · {Math.round((b.count / Math.max(total, 1)) * 100)}%
              </span>
            </li>
          ))}
          {!series.length && <li className="text-charcoal/45">No data</li>}
        </ul>
      </div>
    </div>
  );
}

export function BarCard({ title, series }: { title: string; series: Bucket[] }) {
  const max = Math.max(1, ...series.map((b) => b.count));
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">{title}</h2>
      {series.length ? (
        <ul className="mt-3 space-y-2.5">
          {series.map((b) => (
            <li key={b.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate text-charcoal/70" title={b.label}>
                  {b.label.length > 18 ? b.label.slice(0, 18) + "…" : b.label}
                </span>
                <span className="font-semibold text-charcoal">{b.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-sand-light">
                <div className="h-full rounded-full bg-deep-teal" style={{ width: `${(b.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-charcoal/45">No data</p>
      )}
    </div>
  );
}
