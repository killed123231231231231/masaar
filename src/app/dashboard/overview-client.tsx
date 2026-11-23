"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3, Download, Globe, Globe2, Monitor, Moon,
  QrCode, ScanLine, Smartphone, Sparkles, Sun, Sunrise, Sunset, Users, X,
  type LucideIcon,
} from "lucide-react";
import QrThumb from "@/components/qr-thumb";
import type { SidebarMe } from "@/components/dashboard/sidebar";
import DashboardFrame from "@/components/dashboard/frame";
import SelectMenu from "@/components/dashboard/select-menu";
import {
  Card, CardHeader, EmptyState, FOCUS, INK_BTN, OUTLINE_BTN, PageTitle, PrimaryButton,
} from "@/components/dashboard/ui";
import {
  DonutCard, KpiCard, PeriodSelect, ShareBars, TabbedCard, TrendCard,
  pct, previousLabel, useSetParam,
} from "@/components/dashboard/widgets";
import {
  PERIODS, type AccountAnalyticsBundle, type AccountUserQr,
} from "@/lib/analytics";

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
  // Post-B5 contamination fix (2026-05-24): clear anon-flow localStorage
  // keys on any dashboard mount. Dashboard always implies authed, and an
  // authed user has no use for a leftover draft_token / checkout_pending
  // — those are anon-funnel artifacts (magic-link path lands here too).
  useEffect(() => {
    try {
      localStorage.removeItem("masaar.wizard_state");
      localStorage.removeItem("masaar.checkout_pending");
    } catch {
      /* private mode / quota — non-fatal */
    }
  }, []);

  return (
    <DashboardFrame me={me} current="overview" className="space-y-6">
      <PageHeader
        me={me}
        bundle={bundle}
        filterQrId={filterQrId}
        filterQrName={filterQrName}
      />
      <FailedCallout bundle={bundle} />
      {bundle.totalQrCount === 0 ? (
        <FirstRunEmptyState />
      ) : (
        <>
          <KpiRow bundle={bundle} filtered={!!filterQrName} />
          <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6 xl:space-y-0">
            <div className="min-w-0 space-y-6">
              <TrendCard period={bundle.period} series={bundle.timeSeries} />
              <WidgetsRow bundle={bundle} />
            </div>
            {/* At xl the side column takes the height of the chart column:
                its content is absolutely filled, so "Best performing codes"
                stretches down to the last chart and lists as many codes as
                fit (scrolling inside only there). Below xl it is ordinary
                stacked flow with no inner scroll, so touch scrolling never
                gets trapped. */}
            <div className="xl:relative xl:min-h-[640px]">
              <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
                <BestPerforming userQrs={bundle.userQrs} />
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardFrame>
  );
}

/* ────────────────────────── HEADER ────────────────────────── */

function PageHeader({
  me,
  bundle,
  filterQrId,
  filterQrName,
}: {
  me: SidebarMe;
  bundle: AccountAnalyticsBundle;
  filterQrId: string | null;
  filterQrName: string | null;
}) {
  const firstName =
    me.name && me.name !== me.email ? me.name.split(" ")[0] : null;
  const hasQrs = bundle.totalQrCount > 0;
  return (
    <div className="space-y-4">
      <PageTitle
        title="Analytics Overview"
        sub={
          filterQrName
            ? "Scan activity for one QR code. Use the QR filter to switch."
            : `${firstName ? `Welcome back, ${firstName}. ` : ""}Scans across all your QR codes.`
        }
        right={
          hasQrs ? (
            // One row on phones too: the QR filter flexes and truncates.
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <QrFilterSelect userQrs={bundle.userQrs} current={filterQrId} />
              <PeriodSelect current={bundle.period} />
              <a
                href={
                  filterQrId
                    ? `/api/qr/${encodeURIComponent(filterQrId)}/scans.csv?period=${bundle.period}`
                    : `/api/account/scans.csv?period=${bundle.period}`
                }
                className={`${OUTLINE_BTN} shrink-0 max-sm:w-10 max-sm:px-0`}
                aria-label="Export scans as CSV"
                title={
                  filterQrId
                    ? "Download this QR code's scans in this period as CSV"
                    : "Download every scan in this period as CSV"
                }
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Export</span>
              </a>
            </div>
          ) : (
            <PrimaryButton href="/create" icon={QrCode}>Create QR code</PrimaryButton>
          )
        }
      />
      {filterQrName && <FilterChip name={filterQrName} />}
    </div>
  );
}

/** Themed dropdown over the user's QRs; drives the existing ?qr= filter. */
function QrFilterSelect({ userQrs, current }: { userQrs: AccountUserQr[]; current: string | null }) {
  const setParam = useSetParam();
  return (
    <SelectMenu
      label="Filter by QR code"
      icon={QrCode}
      className="min-w-0 flex-1 sm:max-w-[16rem] sm:flex-none"
      value={current ?? ""}
      options={[{ value: "", label: "All QR codes" }, ...userQrs.map((q) => ({ value: q.id, label: q.name }))]}
      onChange={(v) => setParam("qr", v || null)}
    />
  );
}

// "Viewing: <QR name> ×" chip when ?qr=<id> is active. × clears the filter
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
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-lime py-1 pl-3.5 pr-1 font-body text-[13px] text-ink">
      <span className="truncate">
        Viewing <span className="font-semibold">{name}</span>
      </span>
      <button
        type="button"
        onClick={clear}
        aria-label="Clear QR filter"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/10 hover:bg-ink/20 ${FOCUS}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function FailedCallout({ bundle }: { bundle: AccountAnalyticsBundle }) {
  if (bundle.failedScansCount <= 0) return null;
  const target = bundle.firstPendingQrShortId ?? bundle.firstPendingQrId;
  if (!target) return null;
  return (
    <Card as="div" className="flex flex-wrap items-center gap-4 bg-cream p-4 sm:flex-nowrap sm:p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-ink">
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] font-semibold text-ink">
          {bundle.failedScansCount.toLocaleString()} scans reached inactive QR codes
          {bundle.period !== "all" && (
            <> in the {PERIODS.find((p) => p.id === bundle.period)?.label.toLowerCase()}</>
          )}
          .
        </p>
        <p className="mt-0.5 font-body text-[13px] text-muted-2">
          Visitors see the activation page instead of your destination.
        </p>
      </div>
      <Link href={`/checkout/${target}`} className={INK_BTN}>
        Activate now
      </Link>
    </Card>
  );
}

/* ────────────────────────── KPIs ────────────────────────── */

// Five KPIs: two per row on phones (the fifth spans both), three over two
// on tablets (3 + 2, no orphan gap), one row of five on desktop where the
// KPI row now spans the full content width.
const KPI_THIRD = "md:col-span-2 xl:col-span-1";
const KPI_HALF = "md:col-span-3 xl:col-span-1";

function KpiRow({ bundle, filtered }: { bundle: AccountAnalyticsBundle; filtered: boolean }) {
  const prev = previousLabel(bundle.period);
  // Every scan row falls in exactly one time-of-day bucket, so their sum is
  // the number of scan rows the breakdowns were computed from (share base).
  const rowsTotal = bundle.byTimeOfDay.reduce((s, b) => s + b.count, 0);
  const top = bundle.byCountry[0];
  const inactive = bundle.totalQrCount - bundle.activeQrCount;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 xl:grid-cols-5">
      <KpiCard
        icon={ScanLine}
        tone="lime"
        className={KPI_THIRD}
        label="Total scans"
        value={bundle.total.toLocaleString()}
        delta={bundle.totalDeltaPct}
        deltaLabel={prev}
        today={bundle.scansToday}
      />
      <KpiCard
        icon={Users}
        tone="lilac"
        className={KPI_THIRD}
        label="Unique scanners"
        value={bundle.uniqueScanners.toLocaleString()}
        delta={bundle.uniqueDeltaPct}
        deltaLabel={prev}
        today={bundle.uniqueToday}
      />
      <KpiCard
        icon={Smartphone}
        tone="sky"
        className={KPI_THIRD}
        label="Mobile share"
        value={`${bundle.mobileShare}%`}
        delta={bundle.mobileDeltaPct}
        deltaLabel={prev}
      />
      <KpiCard
        icon={Globe2}
        tone="mint"
        className={KPI_HALF}
        label="Top country"
        value={top?.label ?? "None yet"}
        sub={top && rowsTotal > 0 ? `${pct(top.count, rowsTotal)}% of scans` : "No scans in this period"}
      />
      <KpiCard
        icon={QrCode}
        tone="blush"
        className={`col-span-2 ${KPI_HALF}`}
        label="Active QR codes"
        value={bundle.activeQrCount.toLocaleString()}
        sub={
          <>
            of {bundle.totalQrCount.toLocaleString()}
            {inactive > 0 && <> · {inactive.toLocaleString()} inactive</>}
            {filtered && <span className="block">Across your account</span>}
          </>
        }
      />
    </div>
  );
}

/* ────────────────────────── WIDGETS ────────────────────────── */

function osIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("ios") || l.includes("android") || l.includes("ipados")) return Smartphone;
  return Monitor;
}

const TIME_ICONS: Record<string, LucideIcon> = {
  Morning: Sunrise,
  Midday: Sun,
  Evening: Sunset,
  "Late night": Moon,
};

function WidgetsRow({ bundle }: { bundle: AccountAnalyticsBundle }) {
  const rowsTotal = bundle.byTimeOfDay.reduce((s, b) => s + b.count, 0);
  return (
    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
      <DonutCard
        title="Device split"
        series={bundle.byDevice}
        centerLabel="Scans"
      />
      <TabbedCard
        title="Top locations"
        tabs={[
          { id: "cities", label: "Cities", content: <ShareBars series={bundle.byCity} total={rowsTotal} /> },
          { id: "countries", label: "Countries", content: <ShareBars series={bundle.byCountry} total={rowsTotal} /> },
        ]}
      />
      <TabbedCard
        title="Scan details"
        className="md:col-span-2 2xl:col-span-1"
        tabs={[
          {
            id: "browser",
            label: "Browser",
            content: <ShareBars series={bundle.byBrowser} total={rowsTotal} icon={() => Globe} />,
          },
          {
            id: "os",
            label: "System",
            content: <ShareBars series={bundle.byOs} total={rowsTotal} icon={osIcon} />,
          },
          {
            id: "time",
            label: "Time",
            content: (
              <ShareBars
                series={bundle.byTimeOfDay}
                total={rowsTotal}
                max={4}
                icon={(l) => TIME_ICONS[l] ?? null}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

/* ────────────────────────── BEST PERFORMING ────────────────────────── */

function BestPerforming({ userQrs }: { userQrs: AccountUserQr[] }) {
  // userQrs arrives sorted by all-time scans. The list scrolls inside the
  // card when more codes are ranked than the stretched height can show.
  const top = userQrs.filter((q) => q.scan_count > 0).slice(0, 20);
  const allScans = userQrs.reduce((s, q) => s + q.scan_count, 0);
  const max = Math.max(1, ...top.map((q) => q.scan_count));
  return (
    <Card className="flex flex-1 flex-col overflow-hidden xl:min-h-[320px]">
      <CardHeader title="Best performing codes" note="All-time scans, share of your total" className="px-5 pt-5" />
      {top.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No scans yet"
          body="Your most-scanned codes will be ranked here."
          className="flex-1 py-10"
        />
      ) : (
        <ol className="mt-3 min-h-0 flex-1 divide-y divide-stone border-t border-stone font-body xl:overflow-y-auto xl:[scrollbar-width:thin]">
          {top.map((q, i) => (
            <li key={q.id}>
              <Link
                href={`/dashboard?qr=${q.id}`}
                className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream ${FOCUS} focus-visible:ring-offset-0`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums ${
                    i === 0 ? "bg-lime text-ink" : "bg-stone text-muted-2"
                  }`}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <QrThumb qrId={q.id} bgColor={q.bg_color} size={32} className="rounded-lg border border-stone-dark" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{q.name}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {q.scan_count.toLocaleString()}
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone" aria-hidden>
                      <span
                        className={`block h-full rounded-full ${i === 0 ? "bg-ink" : "bg-ink/60"}`}
                        style={{ width: `${Math.max(3, (q.scan_count / max) * 100)}%` }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-2">
                      {pct(q.scan_count, allScans)}%
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <div className="border-t border-stone px-5 py-3 text-center">
        <Link
          href="/dashboard/qr-codes"
          className={`rounded-full font-body text-[13px] font-medium text-ink underline decoration-lime decoration-2 underline-offset-4 hover:decoration-ink ${FOCUS}`}
        >
          Manage QR codes
        </Link>
      </div>
    </Card>
  );
}

/* ────────────────────────── EMPTY ────────────────────────── */

function FirstRunEmptyState() {
  return (
    <Card className="py-6">
      <EmptyState
        icon={QrCode}
        title="Create your first QR code"
        body="Scans, top cities and devices show up here once people start scanning your codes."
        action={<PrimaryButton href="/create" icon={QrCode}>Create QR code</PrimaryButton>}
      />
    </Card>
  );
}
