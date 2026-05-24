"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity, Filter, Globe2, Plus, QrCode, Smartphone,
  Sparkles, Star, Users, Wallet, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import LogoMark from "@/components/logo-mark";
import QrThumb from "@/components/qr-thumb";
import Sidebar, { type SidebarMe } from "@/components/dashboard/sidebar";
import {
  BarCard, DonutCard, KpiCard, PeriodPills, TrendCard, fmtTime,
} from "@/components/dashboard/widgets";
import { PERIODS, type AccountAnalyticsBundle, type AccountRecentScan } from "@/lib/analytics";

export default function OverviewClient({
  bundle,
  me,
  filterQrId,
  filterQrName,
}: {
  bundle: AccountAnalyticsBundle;
  me: SidebarMe;
  /** B5/Round2 post-merge — when set, the page is in single-QR
   *  filtered mode. Only KPI/breakdown/trend data changes; chrome
   *  and rail are identical to the unfiltered Overview. */
  filterQrId: string | null;
  filterQrName: string | null;
}) {
  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="overview" analyticsHref={null} />
        <Main
          bundle={bundle}
          me={me}
          filterQrId={filterQrId}
          filterQrName={filterQrName}
        />
      </div>
    </div>
  );
}

function Main({
  bundle,
  me,
  filterQrId,
  filterQrName,
}: {
  bundle: AccountAnalyticsBundle;
  me: SidebarMe;
  filterQrId: string | null;
  filterQrName: string | null;
}) {
  return (
    <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
      <MobileTopBar />
      <PageHeader
        me={me}
        period={bundle.period}
        filterQrName={filterQrName}
      />
      <FailedCallout bundle={bundle} />
      {bundle.totalQrCount === 0 ? (
        <FirstRunEmptyState />
      ) : (
        <>
          <KpiRow bundle={bundle} />
          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-7 xl:items-start">
            <div className="space-y-7">
              <TrendCard period={bundle.period} series={bundle.timeSeries} />
              <InsightsRow bundle={bundle} />
              <BreakdownsGrid bundle={bundle} />
              <TablesGrid bundle={bundle} />
            </div>
            <RightRail bundle={bundle} filterQrId={filterQrId} />
          </div>
        </>
      )}
    </main>
  );
}

function MobileTopBar() {
  return (
    <div className="mb-4 flex items-center justify-between lg:hidden">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/65 hover:text-deep-teal">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-deep-teal p-1">
          <LogoMark className="h-full w-full brightness-0 invert" />
        </span>
        Dashboard
      </Link>
      <Link href="/create" className="inline-flex items-center gap-1 rounded-md bg-deep-teal px-2.5 py-1 text-xs font-semibold text-white">
        <Plus className="h-3 w-3" /> Create
      </Link>
    </div>
  );
}

function PageHeader({
  me,
  period,
  filterQrName,
}: {
  me: SidebarMe;
  period: AccountAnalyticsBundle["period"];
  filterQrName: string | null;
}) {
  const firstName = (me.name ?? "").split(" ")[0] || "there";
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {filterQrName ? (
              <>Scan activity scoped to one QR. Click another in the rail to switch.</>
            ) : (
              <>Your account-wide scan activity across every QR code.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast("Custom filters coming in Sprint 3")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-deep-teal-dark"
          >
            <Plus className="h-4 w-4" /> Create QR
          </Link>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PeriodPills current={period} />
        {filterQrName && <FilterChip name={filterQrName} />}
      </div>
    </div>
  );
}

// B5/Round2 post-merge — "Viewing: <QR name> · ×" chip rendered beside
// the period pills when ?qr=<id> is active. The × clears the filter
// via router.replace (no scroll-jump, no full nav).
function FilterChip({ name }: { name: string }) {
  const router = useRouter();
  const params = useSearchParams();
  function clear() {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.delete("qr");
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : "/dashboard", { scroll: false });
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-deep-teal/10 px-3 py-1 text-xs font-semibold text-deep-teal">
      Viewing: <span className="font-bold">{name}</span>
      <button
        type="button"
        onClick={clear}
        aria-label="Clear QR filter"
        className="grid h-4 w-4 place-items-center rounded-full hover:bg-deep-teal/15"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function FailedCallout({ bundle }: { bundle: AccountAnalyticsBundle }) {
  if (bundle.failedScansCount <= 0) return null;
  const target = bundle.firstPendingQrShortId ?? bundle.firstPendingQrId;
  if (!target) return null;
  return (
    <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-terracotta bg-terracotta/5 p-4">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-charcoal">
          {bundle.failedScansCount.toLocaleString()} scans hit your inactive QRs{" "}
          {bundle.period !== "all" && (
            <>in the {PERIODS.find((p) => p.id === bundle.period)?.label.toLowerCase()}</>
          )}
          .
        </p>
        <p className="mt-1 text-xs text-charcoal/65">
          Visitors are seeing the activation page instead of your destination. Activate to start converting.
        </p>
      </div>
      <Link
        href={`/checkout/${target}`}
        className="rounded-md bg-terracotta px-3 py-1.5 text-xs font-semibold text-white hover:bg-terracotta-dark"
      >
        Activate now
      </Link>
    </div>
  );
}

function KpiRow({ bundle }: { bundle: AccountAnalyticsBundle }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        icon={Activity}
        tint="deep-teal"
        label="Total scans"
        value={bundle.total.toLocaleString()}
        delta={bundle.totalDeltaPct}
        series={bundle.timeSeries}
      />
      <KpiCard
        icon={Users}
        tint="terracotta"
        label="Unique scanners"
        value={bundle.uniqueScanners.toLocaleString()}
        delta={bundle.uniqueDeltaPct}
      />
      <KpiCard
        icon={Smartphone}
        tint="sea-teal"
        label="Mobile share"
        value={`${bundle.mobileShare}%`}
        delta={bundle.mobileDeltaPct}
      />
      <KpiCard
        icon={Globe2}
        tint="deep-teal-dark"
        label="Top country"
        value={bundle.topCountry || "—"}
      />
      <KpiCard
        icon={Zap}
        tint="terracotta-dark"
        label="Active QR codes"
        value={`${bundle.activeQrCount} / ${bundle.totalQrCount}`}
      />
    </div>
  );
}

function InsightsRow({ bundle }: { bundle: AccountAnalyticsBundle }) {
  // B5/Item 11 — two donuts side-by-side after the trend chart:
  // Device split + Time-of-day pattern (recommended for Saudi F&B fit).
  // Stacks to a single column under md.
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DonutCard title="Device split" series={bundle.byDevice} centerLabel="Total" />
      <DonutCard title="Time of day" series={bundle.byTimeOfDay} centerLabel="Scans" />
    </div>
  );
}

function BreakdownsGrid({ bundle }: { bundle: AccountAnalyticsBundle }) {
  // Device split moved to InsightsRow (B5/Item 11) to avoid duplication.
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BarCard title="Top cities" series={bundle.byCity} />
      <BarCard title="Top countries" series={bundle.byCountry} />
      <BarCard title="Browsers" series={bundle.byBrowser} />
      <BarCard title="Operating systems" series={bundle.byOs} />
    </div>
  );
}

function TablesGrid({ bundle }: { bundle: AccountAnalyticsBundle }) {
  // B5/Fix 23 — Recent Activity moved out to the dedicated /dashboard/activity
  // page (sidebar nav: "Activity"). The Best Performing Codes table stays
  // here as the only Overview table. RecentActivityTable definition is
  // kept below the file (unused) so a future "show last 5 on Overview"
  // could re-mount it without re-implementing.
  return (
    <div className="grid gap-4">
      <BestPerformingTable userQrs={bundle.userQrs} />
    </div>
  );
}

function RecentActivityTable({ rows }: { rows: AccountRecentScan[] }) {
  // B5/Item 7 — cap at the 5 most-recent scans on the Overview; full
  // activity-list page is a Sprint 3 backlog item, so "View all activity"
  // routes to /dashboard/qr-codes for now (closest existing landing).
  const visible = rows.slice(0, 5);
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">Recent activity</h2>
      {visible.length ? (
        <>
          <div className="-mx-1 mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-charcoal/45">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">When</th>
                  <th className="pb-2 font-semibold">QR</th>
                  <th className="pb-2 font-semibold">Where</th>
                  <th className="pb-2 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id} className="border-t border-charcoal/5">
                    <td className="py-2 whitespace-nowrap text-charcoal/70">{fmtTime(s.scanned_at)}</td>
                    <td className="py-2 text-charcoal/70">
                      {s.qr_id ? (
                        <Link
                          href={`/dashboard?qr=${s.qr_id}`}
                          className="truncate font-medium text-charcoal hover:text-deep-teal"
                        >
                          {s.qr_name}
                        </Link>
                      ) : (
                        <span className="text-charcoal/45">Unknown</span>
                      )}
                    </td>
                    <td className="py-2 text-charcoal/70">
                      {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-2 capitalize text-charcoal/70">{s.device_type || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            href="/dashboard/qr-codes"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-deep-teal hover:underline"
          >
            View all activity →
          </Link>
        </>
      ) : (
        <p className="mt-4 text-xs text-charcoal/45">No recent activity in this period.</p>
      )}
    </div>
  );
}

function BestPerformingTable({
  userQrs,
}: {
  userQrs: { id: string; name: string; short_id: string | null; status: string; scan_count: number }[];
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
                <Link
                  href={`/dashboard?qr=${q.id}`}
                  className="block truncate text-sm font-semibold text-charcoal hover:text-deep-teal"
                >
                  {q.name}
                </Link>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-sand-light">
                  <div
                    className="h-full rounded-full bg-deep-teal"
                    style={{ width: `${(q.scan_count / maxScans) * 100}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-charcoal/65">
                {q.scan_count.toLocaleString()} scans
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-charcoal/45">No codes yet.</p>
      )}
    </div>
  );
}

function RightRail({
  bundle,
  filterQrId,
}: {
  bundle: AccountAnalyticsBundle;
  filterQrId: string | null;
}) {
  // B5/Item 9 — show 6 QR cards in the visible area; if there are more,
  // the list scrolls (smooth + a gradient fade at the bottom signals
  // there's more below). Each card is ~52px tall (h-9 chip + p-2.5 +
  // 8px space-y) so 6 rows ≈ 336px; +28px buffer lets a 7th card peek
  // for discoverability when N > 6.
  const hasOverflow = bundle.userQrs.length > 6;
  const router = useRouter();
  const params = useSearchParams();
  // B5/Round2 post-merge — clicking a QR in the rail no longer navigates
  // to the per-QR analytics route. Instead it sets `?qr=<id>` on the
  // Overview URL via router.replace (no scroll-jump, no full nav, back
  // button stays sane). Page header subtitle + KPI/Trend/Insights/etc
  // data scope to that QR; the rail itself keeps showing all QRs with
  // the active one highlighted so the user can switch in place.
  function selectQr(id: string) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("qr", id);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }
  return (
    /* B5/Round2 Bug B — now a grid cell (xl:grid-cols-[1fr_320px])
       starting after the KPI row. As a card with its own border on all
       sides + the brand soft shadow, consistent with TrendCard /
       KpiCard / etc. The old left-border-only treatment was for the
       previous flex-sibling layout; it now reads as a proper panel. */
    <aside className="rounded-2xl border border-charcoal/10 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)] xl:self-start">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal/75">Your QRs</h2>
      <p className="mt-1 text-[11px] text-charcoal/45">All your codes, sorted by scans.</p>
      <div className="relative mt-4">
        <ul
          className="space-y-2 overflow-y-auto pr-1 [scroll-behavior:smooth] [scrollbar-width:thin]"
          style={{ maxHeight: hasOverflow ? "364px" : undefined }}
        >
          {bundle.userQrs.length ? bundle.userQrs.map((q) => {
            const isActive = q.id === filterQrId;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => selectQr(q.id)}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                    isActive
                      ? "border-deep-teal/40 bg-deep-teal/5"
                      : "border-charcoal/10 hover:bg-sand-light/50"
                  }`}
                >
                  <QrThumb
                    qrId={q.id}
                    bgColor={q.bg_color}
                    size={36}
                    className="border border-charcoal/10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{q.name}</span>
                    <span className="block text-[10px] text-charcoal/45">
                      {q.short_id ? `/r/${q.short_id}` : "static"}
                      {q.status !== "active" && (
                        <> · <span className="text-terracotta-dark">{q.status.replace(/_/g, " ")}</span></>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-deep-teal">{q.scan_count}</span>
                </button>
              </li>
            );
          }) : (
            <li className="text-xs text-charcoal/45">No QR codes yet.</li>
          )}
        </ul>
        {hasOverflow && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" aria-hidden />
        )}
      </div>
      <Link
        href="/dashboard/qr-codes"
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

function FirstRunEmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
      <LogoMark className="mx-auto h-14 w-14 opacity-30" />
      <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">
        Your dashboard is ready
      </h3>
      <p className="mt-2 mx-auto max-w-sm text-sm leading-relaxed text-charcoal/60">
        Create your first dynamic QR code and watch scans roll in across this page.
      </p>
      <Link
        href="/create"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-deep-teal-dark"
      >
        <Plus className="h-4 w-4" /> Create your first QR
      </Link>
    </div>
  );
}
