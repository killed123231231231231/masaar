"use client";

import Link from "next/link";
import {
  Activity, Download, Filter, Globe2, MapPin, QrCode, Smartphone,
  Sparkles, Star, Users, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import LogoMark from "@/components/logo-mark";
import Sidebar, { type SidebarMe } from "@/components/dashboard/sidebar";
import {
  BarCard, DonutCard, KpiCard, PeriodPills, TrendCard, fmtTime,
} from "@/components/dashboard/widgets";
import { PERIODS, type AnalyticsBundle } from "@/lib/analytics";

export default function AnalyticsClient({
  bundle,
  me,
}: {
  bundle: AnalyticsBundle;
  me: SidebarMe;
}) {
  const exportHref = `/api/qr/${bundle.qr.id}/scans.csv?period=${bundle.period}`;
  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar
          me={me}
          current="qrcodes"
          analyticsHref={`/dashboard/qr/${bundle.qr.id}/analytics`}
          reportsHref={exportHref}
          upgradeHref={`/checkout/${bundle.qr.short_id ?? bundle.qr.id}`}
        />
        {/* B5/Round2 Bug B follow-up — per-QR analytics now mirrors
            Overview's layout: same Main column with PageHeader / KPIs
            full-width, then a 2-col grid below with Trend / Breakdowns
            / Tables on the left and the "Your QRs" rail on the right
            (xl+). Only the DATA differs between Overview and per-QR;
            the page chrome is identical so navigation between them
            doesn't feel like a context switch. */}
        <Main bundle={bundle} exportHref={exportHref} />
      </div>
    </div>
  );
}

function Main({ bundle, exportHref }: { bundle: AnalyticsBundle; exportHref: string }) {
  // Matches Overview's layout 1:1 (same Main shell, same 2-col grid
  // after the KPI row, same RightRail position). Only the data differs.
  return (
    <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
      <MobileTopBar bundle={bundle} />
      <PageHeader bundle={bundle} exportHref={exportHref} />
      <FailedCallout bundle={bundle} />
      <KpiRow bundle={bundle} />

      {/* 2-col zone: charts/breakdowns/tables on the left, "Your QRs"
          rail on the right (xl+). On smaller screens the rail stacks
          under main content. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-7 xl:items-start">
        <div className="space-y-7">
          <TrendCard period={bundle.period} series={bundle.timeSeries} />
          <BreakdownsGrid bundle={bundle} />
          <TablesGrid bundle={bundle} />
        </div>
        <RightRail bundle={bundle} />
      </div>
    </main>
  );
}

function MobileTopBar({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="mb-4 flex items-center justify-between lg:hidden">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/65 hover:text-deep-teal">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-deep-teal p-1">
          <LogoMark className="h-full w-full brightness-0 invert" />
        </span>
        Dashboard
      </Link>
      <span className="truncate text-xs text-charcoal/45">{bundle.qr.name}</span>
    </div>
  );
}

function PageHeader({ bundle, exportHref }: { bundle: AnalyticsBundle; exportHref: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            Track scans and performance for{" "}
            <span className="font-medium text-charcoal/75">{bundle.qr.name}</span>
            {bundle.qr.short_id && (<> · <code className="text-xs">/r/{bundle.qr.short_id}</code></>)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={exportHref} className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light">
            <Download className="h-4 w-4" /> Export
          </a>
          <button type="button" onClick={() => toast("Custom filters coming in Sprint 3")} className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>
      <div className="mt-4">
        <PeriodPills current={bundle.period} />
      </div>
    </div>
  );
}

function FailedCallout({ bundle }: { bundle: AnalyticsBundle }) {
  if (bundle.failedScansCount <= 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-terracotta bg-terracotta/5 p-4">
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
      <Link href={`/checkout/${bundle.qr.short_id ?? bundle.qr.id}`} className="rounded-md bg-terracotta px-3 py-1.5 text-xs font-semibold text-white hover:bg-terracotta-dark">
        Activate now
      </Link>
    </div>
  );
}

function KpiRow({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard icon={Activity} tint="deep-teal" label="Total scans" value={bundle.total.toLocaleString()} delta={bundle.totalDeltaPct} series={bundle.timeSeries} />
      <KpiCard icon={Users} tint="terracotta" label="Unique scanners" value={bundle.uniqueScanners.toLocaleString()} delta={bundle.uniqueDeltaPct} />
      <KpiCard icon={Smartphone} tint="sea-teal" label="Mobile share" value={`${bundle.mobileShare}%`} delta={bundle.mobileDeltaPct} />
      <KpiCard icon={Globe2} tint="deep-teal-dark" label="Top country" value={bundle.topCountry || "—"} />
      <KpiCard icon={MapPin} tint="terracotta-dark" label="Top city" value={bundle.topCity || "—"} />
    </div>
  );
}

function BreakdownsGrid({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DonutCard title="Device split" series={bundle.byDevice} centerLabel="Total" />
      <BarCard title="Top cities" series={bundle.byCity} />
      <BarCard title="Top countries" series={bundle.byCountry} />
      <BarCard title="Browsers" series={bundle.byBrowser} />
      <BarCard title="Operating systems" series={bundle.byOs} />
    </div>
  );
}

// Mirrors Overview's TablesGrid behavior: keeps both Recent activity
// (per-QR scoped here) and Best performing codes (account-wide list
// for cross-QR navigation context — same affordance the Overview
// gives). Single-column inside the per-QR 2-col-with-rail grid since
// the rail takes the right side.
function TablesGrid({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="grid gap-4">
      <RecentActivityTable bundle={bundle} />
      <BestPerformingTable userQrs={bundle.userQrs} />
    </div>
  );
}

function RecentActivityTable({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">Recent activity</h2>
      {bundle.recentScans.length ? (
        <div className="-mx-1 mt-3 overflow-x-auto"><table className="w-full text-xs">
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
                <td className="py-2 text-charcoal/70">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="py-2 capitalize text-charcoal/70">{s.device_type || "—"}</td>
                <td className="py-2 text-charcoal/70">{s.browser || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
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
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">Best performing codes</h2>
      {top.length ? (
        <ul className="mt-3 space-y-3">
          {top.map((q) => (
            <li key={q.id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand-light text-charcoal/55">
                <QrCode className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/qr/${q.id}/analytics`} className="block truncate text-sm font-semibold text-charcoal hover:text-deep-teal">{q.name}</Link>
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

function RightRail({ bundle }: { bundle: AnalyticsBundle }) {
  return (
    /* Matches Overview's RightRail chrome — rounded card, brand soft
       shadow, all-sides border, xl:self-start so it doesn't stretch.
       This is the per-QR analytics equivalent — same component visual,
       same data shape, with the currently-viewed QR highlighted in the
       list via the border-deep-teal/40 + bg-deep-teal/5 treatment
       below. */
    <aside className="rounded-2xl border border-charcoal/10 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)] xl:self-start">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">Your QRs</h2>
      <p className="mt-1 text-[11px] text-charcoal/45">All your codes, sorted by scans.</p>
      <ul className="mt-4 space-y-2">
        {bundle.userQrs.length ? bundle.userQrs.slice(0, 10).map((q) => (
          <li key={q.id}>
            <Link
              href={`/dashboard/qr/${q.id}/analytics`}
              className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                q.id === bundle.qr.id ? "border-deep-teal/40 bg-deep-teal/5" : "border-charcoal/10 hover:bg-sand-light/50"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sand-light text-charcoal/55"><QrCode className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{q.name}</span>
                <span className="block text-[10px] text-charcoal/45">{q.short_id ? `/r/${q.short_id}` : "static"}</span>
              </span>
              <span className="shrink-0 text-xs font-bold text-deep-teal">{q.scan_count}</span>
            </Link>
          </li>
        )) : (
          <li className="text-xs text-charcoal/45">No QR codes yet.</li>
        )}
      </ul>
      <Link href="/dashboard/qr-codes" className="mt-4 block rounded-lg border border-charcoal/15 px-3 py-2 text-center text-xs font-semibold text-charcoal/75 hover:bg-sand-light">View all</Link>
      <button type="button" onClick={() => toast("Wallet integration coming in Sprint 3")} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-charcoal/15 px-3 py-2 text-[11px] text-charcoal/45 hover:bg-sand-light">
        <Wallet className="h-3 w-3" /> Add payment method <Star className="h-3 w-3" />
      </button>
    </aside>
  );
}
