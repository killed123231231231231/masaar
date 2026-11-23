"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3, Download, Globe, Globe2, List, Monitor, Moon, MoreHorizontal,
  Pencil, QrCode, ScanLine, Smartphone, Sparkles, Sun, Sunrise, Sunset, Users, X,
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
                fit. Below xl it is ordinary stacked flow. */}
            <div className="xl:relative xl:min-h-[640px]">
              <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
                <RightRail bundle={bundle} filterQrId={filterQrId} />
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
            ? "Scan activity for one QR code. Pick another on the right to switch."
            : `${firstName ? `Welcome back, ${firstName}. ` : ""}Scans across all your QR codes.`
        }
        right={
          hasQrs ? (
            <>
              <QrFilterSelect userQrs={bundle.userQrs} current={filterQrId} />
              <PeriodSelect current={bundle.period} />
              <a
                href={
                  filterQrId
                    ? `/api/qr/${encodeURIComponent(filterQrId)}/scans.csv?period=${bundle.period}`
                    : `/api/account/scans.csv?period=${bundle.period}`
                }
                className={OUTLINE_BTN}
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
            </>
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
      className="max-w-[16rem]"
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

/* ────────────────────────── RIGHT RAIL ────────────────────────── */

function RightRail({
  bundle,
  filterQrId,
}: {
  bundle: AccountAnalyticsBundle;
  filterQrId: string | null;
}) {
  // Four rows visible; more scroll inside the card with a soft fade.
  const hasOverflow = bundle.userQrs.length > 4;
  const router = useRouter();
  const params = useSearchParams();
  // Clicking a QR sets ?qr=<id> on the Overview (router.replace, no
  // scroll-jump). The rail keeps listing every QR with the active one marked.
  function selectQr(id: string) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("qr", id);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }
  return (
    <Card as="aside" aria-label="Your QR codes" className="shrink-0 p-5">
      <CardHeader
        title="Your QR codes"
        note="Sorted by all-time scans"
        right={
          <Link
            href="/dashboard/qr-codes"
            className={`rounded-full font-body text-[13px] font-medium text-ink underline decoration-lime decoration-2 underline-offset-4 hover:decoration-ink ${FOCUS}`}
          >
            View all
          </Link>
        }
      />
      <div className="relative mt-4">
        <ul
          className={`-mx-1 space-y-1 px-1 ${
            hasOverflow ? "overflow-y-auto [scroll-behavior:smooth] [scrollbar-width:thin]" : ""
          }`}
          style={{ maxHeight: hasOverflow ? "248px" : undefined }}
        >
          {bundle.userQrs.map((q) => (
            <RailRow key={q.id} q={q} active={q.id === filterQrId} onSelect={() => selectQr(q.id)} />
          ))}
        </ul>
        {hasOverflow && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" aria-hidden />
        )}
      </div>
    </Card>
  );
}

function RailRow({
  q,
  active,
  onSelect,
}: {
  q: AccountUserQr;
  active: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  // The rail list can scroll on its own, which would clip an absolutely
  // positioned dropdown. The menu is portalled to <body> and placed with
  // fixed coordinates from the trigger, opening upward when there is no
  // room below.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const rootRef = useRef<HTMLLIElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    // Fixed coordinates go stale on scroll/resize; close rather than drift.
    function onMove() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const MENU_H = 150;
      const right = Math.max(8, window.innerWidth - r.right);
      setPos(
        window.innerHeight - r.bottom < MENU_H + 12 && r.top > MENU_H + 12
          ? { bottom: window.innerHeight - r.top + 4, right }
          : { top: r.bottom + 4, right }
      );
    }
    setOpen(true);
  }

  const inactive = q.status !== "active";
  return (
    <li ref={rootRef} className="relative">
      <div
        className={`flex items-center gap-1 rounded-2xl transition-colors ${
          active ? "bg-lime/50 ring-1 ring-inset ring-ink/10" : "hover:bg-cream"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={active}
          title={`Show analytics for ${q.name}`}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left ${FOCUS}`}
        >
          <QrThumb
            qrId={q.id}
            bgColor={q.bg_color}
            size={44}
            className="rounded-xl border border-stone-dark p-0.5"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-sm font-medium text-ink">{q.name}</span>
            <span className="block truncate font-body text-xs text-muted-3">
              {q.kind === "dynamic" ? "Dynamic" : "Static"}
              {inactive && <> · {q.status.replace(/_/g, " ")}</>}
            </span>
            <span className="block font-body text-xs tabular-nums text-muted-2">
              {q.scan_count.toLocaleString()} {q.scan_count === 1 ? "scan" : "scans"}
            </span>
          </span>
        </button>
        <button
          type="button"
          ref={triggerRef}
          onClick={toggleMenu}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`More actions for ${q.name}`}
          className={`mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-2 hover:bg-white hover:text-ink ${FOCUS}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right }}
          className="z-50 w-48 overflow-hidden rounded-2xl border border-stone-dark bg-white p-1.5 font-body shadow-float"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSelect();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <BarChart3 className="h-4 w-4" aria-hidden /> Show analytics
          </button>
          <Link
            href={`/dashboard/qr/${q.id}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <Pencil className="h-4 w-4" aria-hidden /> Edit QR code
          </Link>
          <Link
            href="/dashboard/qr-codes"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <List className="h-4 w-4" aria-hidden /> All QR codes
          </Link>
        </div>,
        document.body,
      )}
    </li>
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
    <Card className="flex min-h-[320px] flex-1 flex-col overflow-hidden">
      <CardHeader title="Best performing codes" note="All-time scans, share of your total" className="px-5 pt-5" />
      {top.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No scans yet"
          body="Your most-scanned codes will be ranked here."
          className="flex-1 py-10"
        />
      ) : (
        <ol className="mt-3 min-h-0 flex-1 divide-y divide-stone overflow-y-auto border-t border-stone font-body [scrollbar-width:thin]">
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
