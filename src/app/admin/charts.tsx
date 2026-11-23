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
      <p className="text-sm text-muted-2">
        <span className="font-heading text-lg font-semibold text-ink">
          {total.toLocaleString("en-US")}
        </span>{" "}
        in 30 days
      </p>
      <div className="mt-3 h-56 w-full">
        {total === 0 ? (
          <div className="grid h-full place-items-center rounded-2xl bg-cream text-sm text-muted-2">
            Nothing in the last 30 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#71717A" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717A" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "#F0EEEB" }}
                content={<DayTooltip seriesLabel={seriesLabel} />}
              />
              <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} maxBarSize={18} />
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
    <div className="rounded-2xl border border-stone-dark bg-white px-3 py-2 font-body shadow-float">
      <p className="text-[11px] text-muted-3">{label}</p>
      <p className="mt-0.5 text-xs">
        <span className="text-muted-2">{seriesLabel}:</span>{" "}
        <span className="font-heading text-sm font-semibold text-ink">
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
    return <p className="text-sm text-muted-2">No QR codes yet.</p>;
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
                <span className="shrink-0 tabular-nums text-muted-2">
                  {t.count.toLocaleString("en-US")}
                  <span className="ml-1.5 text-xs text-muted-3">{pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-stone">
                <div
                  className="h-2 rounded-full bg-ink"
                  style={{ width: `${Math.max((t.count / max) * 100, 2)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div>
        <h3 className="font-heading text-sm font-semibold text-ink">
          Dynamic vs static
        </h3>
        <div
          className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone"
          role="img"
          aria-label={`${kinds.dynamic} dynamic, ${kinds.static} static`}
        >
          <div className="h-3 bg-ink" style={{ width: `${dynPct}%` }} />
          <div className="h-3 bg-lime" style={{ width: `${100 - dynPct}%` }} />
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden />
              Dynamic
            </dt>
            <dd className="tabular-nums text-muted-2">
              {kinds.dynamic.toLocaleString("en-US")} ({dynPct}%)
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-inset ring-ink/20" aria-hidden />
              Static
            </dt>
            <dd className="tabular-nums text-muted-2">
              {kinds.static.toLocaleString("en-US")} ({100 - dynPct}%)
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
