"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis,
} from "recharts";
import { toast } from "sonner";
import {
  Activity, ArrowDown, ArrowUp, BarChart3, Crown, Download, Filter,
  Globe2, LayoutGrid, Link2, MapPin, Megaphone, MonitorSmartphone, Plug,
  QrCode, Settings, Smartphone, Sparkles, Star, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";
import { PERIODS, type AnalyticsBundle, type Bucket, type Period } from "@/lib/analytics";

// Brand chart palette (single source — sweep done; no raw blues left).
const PALETTE = ["#0F5B55", "#E07A5F", "#3FA39A", "#073d3a", "#B85F47", "#D6D1C6"];

interface Me {
  email: string;
  name: string;
  plan: string;       // "Pro" | "Free"
  qrCount: number;
}

const PLAN_LIMITS: Record<string, number> = { Free: 5, Pro: 5000 };

export default function AnalyticsClient({
  bundle,
  me,
}: {
  bundle: AnalyticsBundle;
  me: Me;
}) {
  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="mx-auto flex max-w-[1440px]">
        <Sidebar me={me} qrId={bundle.qr.id} />
        <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
          <Main bundle={bundle} />
          <RightRail bundle={bundle} />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── SIDEBAR ────────────────────────── */

interface NavSpec {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  soon?: boolean;
}

function Sidebar({ me, qrId }: { me: Me; qrId: string }) {
  const nav: NavSpec[] = [
    { label: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { label: "Analytics", icon: BarChart3, active: true },
    { label: "QR Codes", icon: QrCode, href: "/dashboard" },
    { label: "Campaigns", icon: Megaphone, soon: true },
    { label: "Destinations", icon: Link2, soon: true },
    { label: "Audience", icon: Users, soon: true },
    { label: "Devices", icon: MonitorSmartphone, soon: true },
    { label: "Reports", icon: Download, href: `/api/qr/${qrId}/scans.csv?period=30d` },
    { label: "Integrations", icon: Plug, soon: true },
    { label: "Settings", icon: Settings, soon: true },
  ];

  const limit = PLAN_LIMITS[me.plan] ?? 5;
  const used = Math.min(me.qrCount, limit);
  const usagePct = Math.round((used / limit) * 100);

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col bg-deep-teal text-white lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-white p-1">
          <LogoMark className="h-full w-full" />
        </span>
        <span className="font-display text-base font-bold">
          Masaar <span className="font-arabic text-deep-teal-light">مسار</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((n) => {
          const inner = (
            <span
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                n.active
                  ? "bg-white font-semibold text-deep-teal"
                  : n.soon
                    ? "cursor-not-allowed text-white/45 hover:bg-white/5"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <n.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {n.label}
              </span>
              {n.soon && (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/55">
                  Soon
                </span>
              )}
            </span>
          );
          if (n.href) return <Link key={n.label} href={n.href}>{inner}</Link>;
          return (
            <button
              key={n.label}
              type="button"
              className="block w-full text-left"
              onClick={() => n.soon && toast("This feature is coming in Sprint 3")}
            >
              {inner}
            </button>
          );
        })}
      </nav>

      {/* Pro plan card */}
      <div className="mx-3 mb-3 rounded-xl bg-deep-teal-dark p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-terracotta" />
          <span className="text-sm font-semibold">{me.plan} Plan</span>
        </div>
        <p className="mt-2 text-xs text-white/65">
          {used.toLocaleString()} / {limit.toLocaleString()} QRs used
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-terracotta"
            style={{ width: `${Math.min(usagePct, 100)}%` }}
          />
        </div>
        {me.plan === "Free" && (
          <Link
            href={`/checkout/${qrId}`}
            className="mt-3 block rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-deep-teal hover:bg-white/90"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>

      {/* User chip */}
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs font-bold uppercase">
          {(me.name?.[0] || me.email?.[0] || "U").toUpperCase()}
        </span>
        <span className="min-w-0">
          <p className="truncate text-xs font-semibold">{me.name}</p>
          <p className="truncate text-[10px] text-white/55">{me.email}</p>
        </span>
      </div>
    </aside>
  );
}

/* ────────────────────────── MAIN ────────────────────────── */

function Main({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <main className="min-w-0 flex-1 px-5 py-6 lg:px-8">
      <PageHeader bundle={bundle} />
      <FailedCallout bundle={bundle} />
      <KpiRow bundle={bundle} />
      <TrendCard bundle={bundle} />
      <BreakdownsGrid bundle={bundle} />
      <TablesGrid bundle={bundle} />
    </main>
  );
}

function PageHeader({ bundle }: { bundle: AnalyticsBundle }) {
  const router = useRouter();
  const params = useSearchParams();
  function setPeriod(p: Period) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("period", p);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }
  const exportHref = `/api/qr/${bundle.qr.id}/scans.csv?period=${bundle.period}`;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-charcoal/55">
            Track scans and performance for{" "}
            <span className="font-medium text-charcoal/75">{bundle.qr.name}</span>
            {bundle.qr.short_id && (
              <> · <code className="text-xs">/r/{bundle.qr.short_id}</code></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light"
          >
            <Download className="h-4 w-4" /> Export
          </a>
          <button
            type="button"
            onClick={() => toast("Custom filters coming in Sprint 3")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => {
          const active = p.id === bundle.period;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
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
    </div>
  );
}

function FailedCallout({ bundle }: { bundle: AnalyticsBundle }) {
  if (bundle.failedScansCount <= 0) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-r-lg border-l-4 border-terracotta bg-terracotta/5 p-4">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-charcoal">
          {bundle.failedScansCount} scans hit your inactive QR{" "}
          {bundle.period !== "all" && <>in the {PERIODS.find((p) => p.id === bundle.period)?.label.toLowerCase()}</>}.
        </p>
        <p className="mt-1 text-xs text-charcoal/65">
          Visitors are seeing the activation page instead of your destination.
        </p>
      </div>
      <Link
        href={`/checkout/${bundle.qr.short_id ?? bundle.qr.id}`}
        className="rounded-md bg-terracotta px-3 py-1.5 text-xs font-semibold text-white hover:bg-terracotta-dark"
      >
        Activate now
      </Link>
    </div>
  );
}

/* ────────────────────────── KPIs ────────────────────────── */

function KpiRow({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard icon={Activity} tint="deep-teal" label="Total scans" value={bundle.total.toLocaleString()} delta={bundle.totalDeltaPct} series={bundle.timeSeries} />
      <KpiCard icon={Users} tint="terracotta" label="Unique scanners" value={bundle.uniqueScanners.toLocaleString()} delta={bundle.uniqueDeltaPct} />
      <KpiCard icon={Smartphone} tint="sea-teal" label="Mobile share" value={`${bundle.mobileShare}%`} delta={bundle.mobileDeltaPct} />
      <KpiCard icon={Globe2} tint="deep-teal-dark" label="Top country" value={bundle.topCountry || "—"} />
      <KpiCard icon={MapPin} tint="terracotta-dark" label="Top city" value={bundle.topCity || "—"} />
    </div>
  );
}

function KpiCard({
  icon: Icon, tint, label, value, delta, series,
}: {
  icon: LucideIcon;
  tint: "deep-teal" | "terracotta" | "sea-teal" | "deep-teal-dark" | "terracotta-dark";
  label: string;
  value: string;
  delta?: number | null;
  series?: Bucket[];
}) {
  const tintBg: Record<string, string> = {
    "deep-teal": "bg-deep-teal/10 text-deep-teal",
    "terracotta": "bg-terracotta/15 text-terracotta-dark",
    "sea-teal": "bg-[#3FA39A]/15 text-[#3FA39A]",
    "deep-teal-dark": "bg-deep-teal-dark/10 text-deep-teal-dark",
    "terracotta-dark": "bg-terracotta-dark/15 text-terracotta-dark",
  };
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tintBg[tint]}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {series && series.length > 0 && <Sparkline series={series} />}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal/45">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold leading-tight">
        {value}
      </p>
      {delta != null && <Delta pct={delta} />}
    </div>
  );
}

function Delta({ pct }: { pct: number }) {
  const positive = pct >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-deep-teal" : "text-terracotta-dark"}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}% vs previous
    </p>
  );
}

function Sparkline({ series }: { series: Bucket[] }) {
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

/* ────────────────────────── TREND ────────────────────────── */

function TrendCard({ bundle }: { bundle: AnalyticsBundle }) {
  const data = bundle.timeSeries.map((b) => ({ date: b.label.slice(5), count: b.count }));
  const hasData = data.some((d) => d.count > 0);
  return (
    <div className="mb-6 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
          Scan trend over time
        </h2>
        <span className="text-xs text-charcoal/45">
          {PERIODS.find((p) => p.id === bundle.period)?.label}
        </span>
      </div>
      <div className="mt-4 h-72 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F5B55" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0F5B55" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#1B1B1D88" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid rgba(27,27,29,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                cursor={{ stroke: "#0F5B55", strokeDasharray: "3 3" }}
              />
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

function EmptyChart() {
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

/* ────────────────────────── BREAKDOWNS ────────────────────────── */

function BreakdownsGrid({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DonutCard title="Device split" series={bundle.byDevice} centerLabel="Total" />
      <BarCard title="Top cities" series={bundle.byCity} />
      <BarCard title="Top countries" series={bundle.byCountry} />
      <BarCard title="Browsers" series={bundle.byBrowser} />
      <BarCard title="Operating systems" series={bundle.byOs} />
    </div>
  );
}

function DonutCard({ title, series, centerLabel }: { title: string; series: Bucket[]; centerLabel: string }) {
  const total = series.reduce((s, b) => s + b.count, 0);
  const data = series.length ? series : [{ label: "No data", count: 1 }];
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
        {title}
      </h2>
      <div className="mt-3 grid grid-cols-[140px_1fr] items-center gap-4">
        <div className="relative h-[140px] w-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={65} strokeWidth={0}>
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

function BarCard({ title, series }: { title: string; series: Bucket[] }) {
  const max = Math.max(1, ...series.map((b) => b.count));
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
        {title}
      </h2>
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
                <div
                  className="h-full rounded-full bg-deep-teal"
                  style={{ width: `${(b.count / max) * 100}%` }}
                />
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

/* ────────────────────────── TABLES ────────────────────────── */

function TablesGrid({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <RecentActivityTable bundle={bundle} />
      <BestPerformingTable userQrs={bundle.userQrs} />
    </div>
  );
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

function RecentActivityTable({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
        Recent activity
      </h2>
      {bundle.recentScans.length ? (
        <table className="mt-3 w-full text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-charcoal/45">
            <tr className="text-left">
              <th className="pb-2 font-semibold">When</th>
              <th className="pb-2 font-semibold">Where</th>
              <th className="pb-2 font-semibold">Device</th>
              <th className="pb-2 font-semibold">Browser</th>
            </tr>
          </thead>
          <tbody>
            {bundle.recentScans.map((s) => (
              <tr key={s.id} className="border-t border-charcoal/5">
                <td className="py-2 text-charcoal/70 whitespace-nowrap">{fmtTime(s.scanned_at)}</td>
                <td className="py-2 text-charcoal/70">
                  {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="py-2 capitalize text-charcoal/70">{s.device_type || "—"}</td>
                <td className="py-2 text-charcoal/70">{s.browser || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-xs text-charcoal/45">No recent activity in this period.</p>
      )}
    </div>
  );
}

function BestPerformingTable({
  userQrs,
}: {
  userQrs: { id: string; name: string; short_id: string | null; scan_count: number }[];
}) {
  const top = userQrs.slice(0, 5);
  const maxScans = Math.max(1, ...top.map((q) => q.scan_count));
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
        Best performing codes
      </h2>
      {top.length ? (
        <ul className="mt-3 space-y-3">
          {top.map((q) => (
            <li key={q.id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand-light text-charcoal/55">
                <QrCode className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/qr/${q.id}/analytics`} className="block truncate text-sm font-semibold text-charcoal hover:text-deep-teal">
                  {q.name}
                </Link>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-sand-light">
                  <div className="h-full rounded-full bg-deep-teal" style={{ width: `${(q.scan_count / maxScans) * 100}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-charcoal/65">{q.scan_count} scans</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-charcoal/45">No codes yet.</p>
      )}
    </div>
  );
}

/* ────────────────────────── RIGHT RAIL ────────────────────────── */

function RightRail({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <aside className="shrink-0 border-t border-charcoal/10 bg-white px-5 py-6 xl:w-[300px] xl:border-l xl:border-t-0">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">
        Your QRs
      </h2>
      <p className="mt-1 text-[11px] text-charcoal/45">All your codes, sorted by scans.</p>
      <ul className="mt-4 space-y-2">
        {bundle.userQrs.length ? bundle.userQrs.slice(0, 10).map((q) => (
          <li key={q.id}>
            <Link
              href={`/dashboard/qr/${q.id}/analytics`}
              className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                q.id === bundle.qr.id
                  ? "border-deep-teal/40 bg-deep-teal/5"
                  : "border-charcoal/10 hover:bg-sand-light/50"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sand-light text-charcoal/55">
                <QrCode className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{q.name}</span>
                <span className="block text-[10px] text-charcoal/45">
                  {q.short_id ? `/r/${q.short_id}` : "static"}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold text-deep-teal">{q.scan_count}</span>
            </Link>
          </li>
        )) : (
          <li className="text-xs text-charcoal/45">No QR codes yet.</li>
        )}
      </ul>
      <Link
        href="/dashboard"
        className="mt-4 block rounded-lg border border-charcoal/15 px-3 py-2 text-center text-xs font-semibold text-charcoal/75 hover:bg-sand-light"
      >
        View all
      </Link>
      <button
        type="button"
        onClick={() => toast("Wallet integration coming in Sprint 3")}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-charcoal/15 px-3 py-2 text-[11px] text-charcoal/45 hover:bg-sand-light"
      >
        <Wallet className="h-3 w-3" /> Add payment method <Star className="h-3 w-3" />
      </button>
    </aside>
  );
}
