"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

interface Scan {
  scanned_at: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
}

const COLORS = ["#0070cc", "#36abff", "#7ac8ff", "#bae0ff", "#0a3f6f", "#054a86"];

export default function AnalyticsClient({ scans }: { scans: Scan[] }) {
  // Time series — group scans by day (last 30 days)
  const timeSeries = useMemo(() => {
    const today = new Date();
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    scans.forEach((s) => {
      const day = s.scanned_at.slice(0, 10);
      if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  }, [scans]);

  const byDevice = useMemo(() => groupBy(scans, (s) => s.device_type || "desktop"), [scans]);
  const byCountry = useMemo(() => groupBy(scans, (s) => s.country || "Unknown").slice(0, 8), [scans]);
  const byCity = useMemo(() => groupBy(scans, (s) => s.city || "Unknown").slice(0, 8), [scans]);
  const byBrowser = useMemo(() => groupBy(scans, (s) => s.browser || "Unknown").slice(0, 6), [scans]);
  const byOs = useMemo(() => groupBy(scans, (s) => s.os || "Unknown").slice(0, 6), [scans]);

  if (!scans.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900">No scans yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Once someone scans this QR, you&apos;ll see real-time data here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Total scans" value={scans.length} />
        <Kpi label="Unique countries" value={new Set(scans.map((s) => s.country).filter(Boolean)).size} />
        <Kpi label="Mobile share" value={`${pct(byDevice, "mobile")}%`} />
        <Kpi label="Last scan" value={timeAgo(scans[0]?.scanned_at)} />
      </div>

      {/* Time series */}
      <Card title="Scans over time (last 30 days)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0070cc" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0070cc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0070cc" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top countries">
          <BreakdownBar data={byCountry} />
        </Card>
        <Card title="Top cities">
          <BreakdownBar data={byCity} />
        </Card>
        <Card title="Devices">
          <BreakdownPie data={byDevice} />
        </Card>
        <Card title="Browsers">
          <BreakdownBar data={byBrowser} />
        </Card>
        <Card title="Operating systems">
          <BreakdownBar data={byOs} />
        </Card>
      </div>
    </div>
  );
}

// ----------------- helpers -----------------

function groupBy<T>(rows: T[], keyFn: (r: T) => string) {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = keyFn(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function pct(data: { key: string; count: number }[], key: string) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return 0;
  const hit = data.find((d) => d.key === key)?.count ?? 0;
  return Math.round((hit / total) * 100);
}

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ----------------- presentation -----------------

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BreakdownBar({ data }: { data: { key: string; count: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis dataKey="key" type="category" tick={{ fontSize: 11 }} width={100} />
          <Tooltip />
          <Bar dataKey="count" fill="#0070cc" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BreakdownPie({ data }: { data: { key: string; count: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="key"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
        {data.map((d, i) => (
          <span key={d.key} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {d.key} ({d.count})
          </span>
        ))}
      </div>
    </div>
  );
}
