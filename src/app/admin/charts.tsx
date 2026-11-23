"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DailyPoint = { day: string; count: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-23" -> "23 Nov" without going through a Date (no timezone shift). */
function shortDay(key: string): string {
  const [, m, d] = key.split("-");
  const mi = Number(m) - 1;
  return `${Number(d)} ${MONTHS[mi] ?? ""}`.trim();
}

export function DailyBarChart({
  data,
  seriesLabel,
  color,
}: {
  data: DailyPoint[];
  seriesLabel: string;
  color: string;
}) {
  const total = data.reduce((s, p) => s + p.count, 0);
  const rows = data.map((p) => ({ label: shortDay(p.day), count: p.count }));

  return (
    <div>
      <p className="text-sm text-charcoal/70">
        <span className="font-display text-lg font-bold text-charcoal">
          {total.toLocaleString("en-US")}
        </span>{" "}
        in 30 days
      </p>
      <div className="mt-3 h-56 w-full">
        {total === 0 ? (
          <div className="grid h-full place-items-center rounded-lg border border-dashed border-charcoal/15 text-sm text-charcoal/60">
            Nothing in the last 30 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#1B1B1D99" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#1B1B1D99" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "#0F5B5510" }}
                content={<DayTooltip seriesLabel={seriesLabel} />}
              />
              <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function DayTooltip({
  active,
  label,
  payload,
  seriesLabel,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string }[];
  seriesLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const count = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <p className="text-[11px] text-charcoal/60">{label}</p>
      <p className="mt-0.5 text-xs">
        <span className="text-charcoal/70">{seriesLabel}:</span>{" "}
        <span className="font-display text-sm font-bold text-deep-teal">
          {count.toLocaleString("en-US")}
        </span>
      </p>
    </div>
  );
}

export function QrTypeList({
  types,
  kinds,
}: {
  types: { label: string; count: number }[];
  kinds: { dynamic: number; static: number };
}) {
  const total = kinds.dynamic + kinds.static;
  if (total === 0) {
    return <p className="text-sm text-charcoal/60">No QR codes yet.</p>;
  }
  const max = Math.max(...types.map((t) => t.count), 1);
  const dynPct = Math.round((kinds.dynamic / total) * 100);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <ul className="space-y-3">
        {types.map((t) => {
          const pct = Math.round((t.count / total) * 100);
          return (
            <li key={t.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{t.label}</span>
                <span className="shrink-0 tabular-nums text-charcoal/70">
                  {t.count.toLocaleString("en-US")}
                  <span className="ml-1.5 text-xs text-charcoal/50">{pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-sand-light">
                <div
                  className="h-2 rounded-full bg-deep-teal"
                  style={{ width: `${Math.max((t.count / max) * 100, 2)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
          Dynamic vs static
        </h3>
        <div
          className="mt-3 flex h-3 overflow-hidden rounded-full bg-sand-light"
          role="img"
          aria-label={`${kinds.dynamic} dynamic, ${kinds.static} static`}
        >
          <div className="h-3 bg-deep-teal" style={{ width: `${dynPct}%` }} />
          <div className="h-3 bg-terracotta" style={{ width: `${100 - dynPct}%` }} />
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-deep-teal" aria-hidden />
              Dynamic
            </dt>
            <dd className="tabular-nums text-charcoal/70">
              {kinds.dynamic.toLocaleString("en-US")} ({dynPct}%)
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-terracotta" aria-hidden />
              Static
            </dt>
            <dd className="tabular-nums text-charcoal/70">
              {kinds.static.toLocaleString("en-US")} ({100 - dynPct}%)
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
