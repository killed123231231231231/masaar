"use client";

import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ScanLine, TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { PERIODS, type Bucket, type Period } from "@/lib/analytics";
import { Card, CardHeader, FOCUS, IconWell } from "@/components/dashboard/ui";
import SelectMenu from "@/components/dashboard/select-menu";
import { GRANULARITY_LABEL, bucketTrend, type TrendPoint } from "@/components/dashboard/trend-buckets";

// Chart palette: ink, lime, lilac, sky only (owner's rule).
export const PALETTE = ["#1A1A1A", "#DBFC74", "#E3B8FF", "#A9CCFF"];
const INK = "#1A1A1A";
const MUTED = "#71717A";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Riyadh time, 12-hour clock: "Nov 23, 10:24 PM" (optionally with year). */
export function fmtTime(iso: string, opts: { year?: boolean } = {}): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Riyadh",
    month: "short",
    day: "numeric",
    ...(opts.year ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "2026-11-23" -> "Nov 23" without a Date (no timezone shift). */
export function shortDay(key: string): string {
  const [, m, d] = key.split("-");
  const mi = Number(m) - 1;
  if (!MONTHS[mi] || !d) return key;
  return `${MONTHS[mi]} ${Number(d)}`;
}

export function periodLabel(p: Period): string {
  return PERIODS.find((x) => x.id === p)?.label ?? "";
}

/** "previous 30 days" style comparison label, or null for all-time. */
export function previousLabel(p: Period): string | null {
  return p === "7d" ? "previous 7 days" : p === "30d" ? "previous 30 days" : p === "90d" ? "previous 90 days" : null;
}

export function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (key: string, value: string | null) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (value === null) sp.delete(key);
    else sp.set(key, value);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
}

/* ────────────────────────── PERIOD CONTROLS ────────────────────────── */

/** Segmented pills (stone track, white active). Keeps every other param. */
export function PeriodPills({ current }: { current: Period }) {
  const setParam = useSetParam();
  return (
    <div role="group" aria-label="Period" className="grid w-full grid-cols-4 gap-1 rounded-full bg-stone p-1 sm:inline-flex sm:w-auto">
      {PERIODS.map((p) => {
        const active = p.id === current;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => setParam("period", p.id)}
            className={`h-8 whitespace-nowrap rounded-full px-1.5 font-body text-[12px] font-medium transition-colors sm:px-3.5 sm:text-[13px] ${FOCUS} ${
              active ? "bg-white text-ink shadow-card" : "text-muted-2 hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/** Calendar pill with the themed dropdown. Keeps every other param. */
export function PeriodSelect({
  current,
  size = "md",
  align = "left",
}: {
  current: Period;
  size?: "sm" | "md";
  align?: "left" | "right";
}) {
  const setParam = useSetParam();
  return (
    <SelectMenu
      label="Period"
      icon={CalendarDays}
      size={size}
      align={align}
      value={current}
      options={PERIODS.map((p) => ({ value: p.id, label: p.label }))}
      onChange={(v) => setParam("period", v)}
    />
  );
}

/* ────────────────────────── KPI ────────────────────────── */

export function KpiCard({
  icon,
  tone = "stone",
  label,
  value,
  valueTitle,
  delta,
  deltaLabel,
  today,
  sub,
  className = "",
}: {
  className?: string;
  icon: LucideIcon;
  tone?: "stone" | "lime" | "lilac" | "sky" | "mint" | "blush";
  label: string;
  value: string;
  /** Full value for the tooltip when the visible one may truncate. */
  valueTitle?: string;
  delta?: number | null;
  deltaLabel?: string | null;
  /** Riyadh-day count → "+N today" line (Total / Unique scans). */
  today?: number | null;
  sub?: React.ReactNode;
}) {
  return (
    <Card as="div" className={`flex h-full min-w-0 flex-col p-4 sm:p-5 ${className}`}>
      {/* Label row: on phones the icon sits above the label so two-word
          labels ("Unique scanners") stay on one line and every card's
          number lines up; from sm up they share a row. */}
      {/* Top-right corner: "+N today" when the card has a daily count,
          otherwise the period change pill (Mobile share). */}
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2.5">
          <IconWell icon={icon} tone={tone} size="sm" />
          <p className="min-w-0 whitespace-nowrap font-body text-[13px] font-medium leading-snug text-muted-2">{label}</p>
        </div>
        {today != null ? (
          <TodayBadge count={today} />
        ) : delta != null ? (
          <DeltaPill pct={delta} />
        ) : null}
      </div>
      <p
        className={`mt-4 min-w-0 break-words font-heading font-semibold leading-[1.1] tracking-[-0.02em] text-ink ${
          value.length > 14 ? "text-xl" : value.length > 9 ? "text-[22px]" : "text-[28px]"
        }`}
        title={valueTitle ?? value}
      >
        {value}
      </p>
      <div className="mt-auto space-y-1.5 pt-3">
        {delta != null &&
          (today != null ? (
            <Delta pct={delta} label={deltaLabel ?? null} />
          ) : (
            deltaLabel && <p className="font-body text-xs text-muted-3">vs {deltaLabel}</p>
          ))}
        {sub && <div className="font-body text-xs leading-snug text-muted-3">{sub}</div>}
      </div>
    </Card>
  );
}

// Good/bad tones for change indicators: green when up, red when down,
// neutral at zero.
const GOOD = "bg-[#E3F7EA] text-[#15803D]";
const BAD = "bg-[#FDE8E8] text-[#C62828]";
const FLAT = "bg-stone text-muted-2";

/** Bare change pill (↗ 12%), coloured by direction. */
export function DeltaPill({ pct }: { pct: number }) {
  const up = pct > 0;
  const down = pct < 0;
  const Icon = down ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-body text-xs font-semibold ${
        up ? GOOD : down ? BAD : FLAT
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span className="sr-only">{up ? "Up" : down ? "Down" : "No change"}</span>
      {Math.abs(pct)}%
    </span>
  );
}

export function Delta({ pct, label }: { pct: number; label?: string | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-body text-xs text-muted-3">
      <DeltaPill pct={pct} />
      {label && <span>vs {label}</span>}
    </p>
  );
}

// "+N today" — Riyadh calendar-day activity line for the count KPIs.
export function TodayBadge({ count }: { count: number }) {
  const has = count > 0;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-body text-xs font-semibold ${
        has ? GOOD : FLAT
      }`}
      title={`${count} ${count === 1 ? "scan" : "scans"} today (Riyadh time)`}
    >
      {has && <TrendingUp className="h-3 w-3" aria-hidden />}
      {has ? `+${count.toLocaleString()} today` : "0 today"}
    </span>
  );
}

/* ────────────────────────── TREND ────────────────────────── */

export function TrendCard({
  period,
  series,
  title = "Scan trend over time",
}: {
  period: Period;
  series: Bucket[];
  title?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const { granularity, points: data } = bucketTrend(series, period);
  const hasData = data.some((d) => d.count > 0);
  const showDots = data.length <= 31;
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title={title}
        note={
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" aria-hidden /> Scans · {periodLabel(period)}
          </span>
        }
        right={
          <div className="flex flex-wrap items-center gap-2">
            {/* Granularity follows the range: daily up to 30 days, weekly
                for 90 days, weekly or monthly for all time. */}
            <span
              className="inline-flex h-8 items-center rounded-full bg-stone px-3 font-body text-xs font-medium text-ink"
              title={`One point per ${granularity}`}
            >
              {GRANULARITY_LABEL[granularity]}
            </span>
            <PeriodSelect current={period} size="sm" align="right" />
          </div>
        }
      />
      <div className="mt-5 h-64 w-full sm:h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`trend-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DBFC74" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#DBFC74" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F0EEEB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: MUTED }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              {/* Integer ticks so scan counts stay legible. */}
              <YAxis
                tick={{ fontSize: 11, fill: MUTED }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip cursor={{ stroke: INK, strokeDasharray: "3 3" }} content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={INK}
                strokeWidth={2}
                fill={`url(#trend-${gid})`}
                dot={showDots ? { r: 3, fill: INK, stroke: "#fff", strokeWidth: 1.5 } : false}
                activeDot={{ r: 5, fill: INK, stroke: "#DBFC74", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  );
}

function TrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string; payload?: TrendPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const count = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-2xl border border-stone-dark bg-white px-3 py-2 font-body shadow-float">
      <p className="text-[11px] text-muted-3">{payload[0]?.payload?.full ?? label}</p>
      <p className="mt-0.5 text-xs text-muted-2">
        Scans <span className="ml-1 font-heading text-sm font-semibold text-ink">{count.toLocaleString()}</span>
      </p>
    </div>
  );
}

export function EmptyChart({
  title = "No scans in this period",
  body = "When someone scans one of your QR codes, it shows up here.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="grid h-full place-items-center rounded-2xl bg-cream px-4 text-center">
      <div>
        <IconWell icon={ScanLine} tone="stone" className="mx-auto" />
        <p className="mt-3 font-heading text-[15px] font-semibold text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-xs font-body text-xs text-muted-2">{body}</p>
      </div>
    </div>
  );
}

/* ────────────────────────── DONUT ────────────────────────── */

export function DonutCard({
  title,
  series,
  centerLabel,
  note,
  className = "",
}: {
  title: string;
  series: Bucket[];
  centerLabel: string;
  note?: React.ReactNode;
  className?: string;
}) {
  const total = series.reduce((s, b) => s + b.count, 0);
  const has = total > 0;
  const data = has ? series : [{ label: "No data", count: 1 }];
  return (
    <Card className={`flex flex-col p-5 ${className}`}>
      <CardHeader title={title} note={note} />
      {/* Donut above, full-width legend below: labels never truncate, at
          any card width. */}
      <div className="mt-4 flex flex-1 flex-col items-center gap-5">
        {/* outline-none kills the square focus box recharts' Pie sectors show. */}
        <div className="relative h-[148px] w-[148px] shrink-0 [&_:focus]:outline-none [&_svg]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={has && series.length > 1 ? 2 : 0}
                strokeWidth={0}
                rootTabIndex={-1}
                isAnimationActive={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={has ? PALETTE[i % PALETTE.length] : "#F0EEEB"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="font-heading text-xl font-semibold leading-none text-ink">{total.toLocaleString()}</p>
              <p className="mt-1 font-body text-[11px] text-muted-3">{centerLabel}</p>
            </div>
          </div>
        </div>
        <ul className="w-full divide-y divide-stone font-body text-[13px]">
          {has ? (
            series.map((b, i) => (
              <li key={b.label} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-ink/10"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 break-words capitalize text-ink">{b.label}</span>
                <span className="shrink-0 tabular-nums text-muted-3">{b.count.toLocaleString()}</span>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums text-ink">{pct(b.count, total)}%</span>
              </li>
            ))
          ) : (
            <li className="text-center text-muted-3">No scans yet</li>
          )}
        </ul>
      </div>
    </Card>
  );
}

export function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/* ────────────────────────── BARS ────────────────────────── */

/** Horizontal share bars (label · bar · %). `total` is the share base. */
export function ShareBars({
  series,
  total,
  max = 5,
  icon,
}: {
  series: Bucket[];
  total: number;
  max?: number;
  /** Optional per-row icon resolver (e.g. browser / OS / time icons). */
  icon?: (label: string) => LucideIcon | null;
}) {
  const rows = series.slice(0, max);
  if (!rows.length || total <= 0) {
    return <p className="py-6 text-center font-body text-[13px] text-muted-3">No scans yet</p>;
  }
  const top = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-3.5 font-body text-[13px]">
      {rows.map((b, i) => {
        const Icon = icon?.(b.label) ?? null;
        return (
          <li key={b.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-muted-2" title={`${b.label}: ${b.count.toLocaleString()} scans`}>
                {Icon && (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone text-ink">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  </span>
                )}
                <span className="truncate">{b.label}</span>
              </span>
              <span className="shrink-0 tabular-nums font-medium text-ink">
                {pct(b.count, total)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone" aria-hidden>
              <div
                className={`h-full rounded-full ${i === 0 ? "bg-ink" : "bg-ink/60"}`}
                style={{ width: `${Math.max(3, (b.count / top) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BarCard({
  title,
  series,
  total,
  note,
}: {
  title: string;
  series: Bucket[];
  total?: number;
  note?: React.ReactNode;
}) {
  const base = total ?? series.reduce((s, b) => s + b.count, 0);
  return (
    <Card className="p-5">
      <CardHeader title={title} note={note} />
      <div className="mt-4">
        <ShareBars series={series} total={base} />
      </div>
    </Card>
  );
}

/* ────────────────────────── TABS ────────────────────────── */

/** Card with a small segmented tab switcher (ARIA tabs). */
export function TabbedCard({
  title,
  tabs,
  className = "",
}: {
  title: string;
  tabs: { id: string; label: string; content: React.ReactNode }[];
  className?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId().replace(/:/g, "");
  return (
    <Card className={`p-5 ${className}`}>
      <CardHeader
        title={title}
        right={
          <div role="tablist" aria-label={title} className="inline-flex gap-0.5 rounded-full bg-stone p-0.5">
            {tabs.map((t) => {
              const on = t.id === active;
              return (
                <button
                  key={t.id}
                  id={`${base}-tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls={`${base}-panel-${t.id}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(t.id)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                    e.preventDefault();
                    const idx = tabs.findIndex((x) => x.id === t.id);
                    const next = tabs[(idx + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                    setActive(next.id);
                    document.getElementById(`${base}-tab-${next.id}`)?.focus();
                  }}
                  className={`h-7 rounded-full px-2.5 font-body text-xs font-medium transition-colors ${FOCUS} ${
                    on ? "bg-white text-ink shadow-card" : "text-muted-2 hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        }
      />
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          className="mt-4"
        >
          {t.content}
        </div>
      ))}
    </Card>
  );
}
