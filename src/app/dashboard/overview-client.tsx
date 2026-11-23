"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3, ChevronDown, Download, Globe, Globe2, List, Monitor, Moon, MoreHorizontal,
  Pencil, QrCode, ScanLine, Smartphone, Sparkles, Sun, Sunrise, Sunset, Tablet, Users, X,
  type LucideIcon,
} from "lucide-react";
import QrThumb from "@/components/qr-thumb";
import type { SidebarMe } from "@/components/dashboard/sidebar";
import DashboardFrame from "@/components/dashboard/frame";
import {
  Card, CardHeader, EmptyState, FOCUS, INK_BTN, OUTLINE_BTN, PageTitle, PrimaryButton, SECONDARY_BTN,
} from "@/components/dashboard/ui";
import {
  DonutCard, KpiCard, PeriodSelect, ShareBars, TabbedCard, TrendCard,
  fmtTime, pct, previousLabel, useSetParam,
} from "@/components/dashboard/widgets";
import {
  PERIODS, type AccountAnalyticsBundle, type AccountRecentScan, type AccountUserQr,
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
          <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_296px] xl:items-start xl:gap-6 xl:space-y-0">
            <div className="space-y-6">
              <KpiRow bundle={bundle} filtered={!!filterQrName} />
              <TrendCard period={bundle.period} series={bundle.timeSeries} />
              <WidgetsRow bundle={bundle} />
            </div>
            <RightRail bundle={bundle} filterQrId={filterQrId} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <RecentActivity rows={bundle.recentScans} userQrs={bundle.userQrs} />
            <BestPerforming userQrs={bundle.userQrs} />
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
                title={
                  filterQrId
                    ? "Download this QR code's scans in this period as CSV"
                    : "Download every scan in this period as CSV"
                }
              >
                <Download className="h-4 w-4" aria-hidden /> Export
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

/** Native select over the user's QRs; drives the existing ?qr= filter. */
function QrFilterSelect({ userQrs, current }: { userQrs: AccountUserQr[]; current: string | null }) {
  const setParam = useSetParam();
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">Filter by QR code</label>
      <QrCode className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" aria-hidden />
      <select
        id={id}
        value={current ?? ""}
        onChange={(e) => setParam("qr", e.target.value || null)}
        className={`h-10 max-w-[15rem] cursor-pointer appearance-none truncate rounded-full border border-stone-dark bg-white pl-10 pr-9 font-body text-sm font-medium text-ink transition-colors hover:bg-cream ${FOCUS}`}
      >
        <option value="">All QR codes</option>
        {userQrs.map((q) => (
          <option key={q.id} value={q.id}>{q.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-3" aria-hidden />
    </div>
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

function KpiRow({ bundle, filtered }: { bundle: AccountAnalyticsBundle; filtered: boolean }) {
  const prev = previousLabel(bundle.period);
  // Every scan row falls in exactly one time-of-day bucket, so their sum is
  // the number of scan rows the breakdowns were computed from (share base).
  const rowsTotal = bundle.byTimeOfDay.reduce((s, b) => s + b.count, 0);
  const top = bundle.byCountry[0];
  const inactive = bundle.totalQrCount - bundle.activeQrCount;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        icon={ScanLine}
        tone="lime"
        label="Total scans"
        value={bundle.total.toLocaleString()}
        delta={bundle.totalDeltaPct}
        deltaLabel={prev}
        today={bundle.scansToday}
      />
      <KpiCard
        icon={Users}
        tone="lilac"
        label="Unique scanners"
        value={bundle.uniqueScanners.toLocaleString()}
        delta={bundle.uniqueDeltaPct}
        deltaLabel={prev}
        today={bundle.uniqueToday}
      />
      <KpiCard
        icon={Smartphone}
        tone="sky"
        label="Mobile share"
        value={`${bundle.mobileShare}%`}
        delta={bundle.mobileDeltaPct}
        deltaLabel={prev}
      />
      <KpiCard
        icon={Globe2}
        tone="mint"
        label="Top country"
        value={top?.label ?? "None yet"}
        sub={top && rowsTotal > 0 ? `${pct(top.count, rowsTotal)}% of scans` : "No scans in this period"}
      />
      <KpiCard
        icon={QrCode}
        tone="blush"
        className="col-span-2 md:col-span-1"
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

function deviceIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("mobile") || l.includes("phone")) return Smartphone;
  if (l.includes("tablet")) return Tablet;
  return Monitor;
}

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
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        className="md:col-span-2 xl:col-span-1"
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
  // Six rows visible; more scroll inside the card with a soft fade.
  const hasOverflow = bundle.userQrs.length > 6;
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
    <Card as="aside" aria-label="Your QR codes" className="p-5 xl:sticky xl:top-6">
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
          style={{ maxHeight: hasOverflow ? "424px" : undefined }}
        >
          {bundle.userQrs.map((q) => (
            <RailRow key={q.id} q={q} active={q.id === filterQrId} onSelect={() => selectQr(q.id)} />
          ))}
        </ul>
        {hasOverflow && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" aria-hidden />
        )}
      </div>
      <Link href="/dashboard/qr-codes" className={`${SECONDARY_BTN} mt-4 w-full`}>
        Manage QR codes
      </Link>
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

/* ────────────────────────── TABLES ────────────────────────── */

/** Readable destination: host for web links, a plain label otherwise. */
function destinationLabel(dest: string | null | undefined): string {
  if (!dest) return "—";
  try {
    const u = new URL(dest);
    if (u.protocol === "http:" || u.protocol === "https:") {
      const path = u.pathname === "/" ? "" : u.pathname;
      return `${u.host.replace(/^www\./, "")}${path}`;
    }
  } catch {
    /* not a URL */
  }
  return "Static content";
}

function location(s: AccountRecentScan): string {
  return [s.city, s.country].filter(Boolean).join(", ") || "Unknown";
}

function deviceLabel(s: AccountRecentScan): string {
  // The row icon already shows the device class, so prefer the OS name.
  if (s.os) return s.os;
  return s.device_type ? s.device_type[0].toUpperCase() + s.device_type.slice(1) : "Unknown";
}

const TH = "px-2.5 py-2.5 text-left font-body text-xs font-medium text-muted-3 whitespace-nowrap first:pl-5 last:pr-5";
const TD = "px-2.5 py-3 align-middle first:pl-5 last:pr-5";

function RecentActivity({
  rows,
  userQrs,
}: {
  rows: AccountRecentScan[];
  userQrs: AccountUserQr[];
}) {
  const visible = rows.slice(0, 6);
  const byId = new Map(userQrs.map((q) => [q.id, q]));
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader title="Recent activity" note="Latest scans in this period · Riyadh time" className="px-5 pt-5" />
      {visible.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No scans yet"
          body="New scans appear here as they happen."
          className="py-10"
        />
      ) : (
        <>
          {/* md+: table */}
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[600px] font-body text-[13px]">
              <thead className="border-y border-stone bg-cream">
                <tr>
                  <th scope="col" className={TH}>QR code</th>
                  <th scope="col" className={TH}>Destination</th>
                  <th scope="col" className={TH}>Location</th>
                  <th scope="col" className={TH}>Device</th>
                  <th scope="col" className={TH}>Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {visible.map((s) => {
                  const q = byId.get(s.qr_id);
                  const Dev = deviceIcon(s.device_type ?? "");
                  return (
                    <tr key={s.id} className="hover:bg-cream/60">
                      <td className={TD}>
                        {s.qr_id ? (
                          <Link
                            href={`/dashboard?qr=${s.qr_id}`}
                            className={`flex max-w-[170px] items-center gap-2.5 rounded-lg font-medium text-ink hover:underline ${FOCUS}`}
                          >
                            <QrThumb qrId={s.qr_id} bgColor={q?.bg_color} size={28} className="rounded-md border border-stone-dark" />
                            <span className="truncate">{s.qr_name}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-3">Unknown</span>
                        )}
                      </td>
                      <td className={`${TD} max-w-[150px] truncate text-muted-2`} title={q?.destination}>
                        {destinationLabel(q?.destination)}
                      </td>
                      <td className={`${TD} max-w-[150px] truncate text-muted-2`} title={location(s)}>{location(s)}</td>
                      <td className={`${TD} whitespace-nowrap text-muted-2`}>
                        <span className="inline-flex items-center gap-1.5">
                          <Dev className="h-3.5 w-3.5 text-ink" strokeWidth={1.75} aria-hidden />
                          {deviceLabel(s)}
                        </span>
                      </td>
                      <td className={`${TD} whitespace-nowrap tabular-nums text-muted-2`}>{fmtTime(s.scanned_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* <md: stacked cards */}
          <ul className="mt-3 divide-y divide-stone border-t border-stone md:hidden">
            {visible.map((s) => {
              const q = byId.get(s.qr_id);
              return (
                <li key={s.id} className="flex items-start gap-3 px-5 py-3.5">
                  {s.qr_id && (
                    <QrThumb qrId={s.qr_id} bgColor={q?.bg_color} size={36} className="rounded-lg border border-stone-dark" />
                  )}
                  <div className="min-w-0 flex-1 font-body">
                    <div className="flex items-baseline justify-between gap-3">
                      {s.qr_id ? (
                        <Link href={`/dashboard?qr=${s.qr_id}`} className={`truncate text-sm font-medium text-ink ${FOCUS}`}>
                          {s.qr_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-3">Unknown</span>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-muted-3">{fmtTime(s.scanned_at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-2">{destinationLabel(q?.destination)}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-3">
                      {location(s)} · {deviceLabel(s)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="mt-auto border-t border-stone px-5 py-3 text-center">
        <Link
          href="/dashboard/activity"
          className={`rounded-full font-body text-[13px] font-medium text-ink underline decoration-lime decoration-2 underline-offset-4 hover:decoration-ink ${FOCUS}`}
        >
          View all activity
        </Link>
      </div>
    </Card>
  );
}

function BestPerforming({ userQrs }: { userQrs: AccountUserQr[] }) {
  const top = userQrs.filter((q) => q.scan_count > 0).slice(0, 5);
  const allScans = userQrs.reduce((s, q) => s + q.scan_count, 0);
  const max = Math.max(1, ...top.map((q) => q.scan_count));
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader title="Best performing codes" note="All-time scans · share of your total" className="px-5 pt-5" />
      {top.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No scans yet"
          body="Your most-scanned codes will be ranked here."
          className="py-10"
        />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[340px] font-body text-[13px]">
            <thead className="border-y border-stone bg-cream">
              <tr>
                <th scope="col" className={TH}>QR code</th>
                <th scope="col" className={`${TH} text-right`}>Scans</th>
                <th scope="col" className={TH}>Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {top.map((q, i) => (
                <tr key={q.id} className="hover:bg-cream/60">
                  <td className={TD}>
                    <Link
                      href={`/dashboard?qr=${q.id}`}
                      className={`flex max-w-[220px] items-center gap-2.5 rounded-lg font-medium text-ink hover:underline ${FOCUS}`}
                    >
                      <QrThumb qrId={q.id} bgColor={q.bg_color} size={28} className="rounded-md border border-stone-dark" />
                      <span className="truncate">{q.name}</span>
                    </Link>
                  </td>
                  <td className={`${TD} text-right tabular-nums font-medium text-ink`}>
                    {q.scan_count.toLocaleString()}
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-full min-w-[60px] overflow-hidden rounded-full bg-stone" aria-hidden>
                        <div
                          className={`h-full rounded-full ${i === 0 ? "bg-ink" : "bg-ink/60"}`}
                          style={{ width: `${Math.max(3, (q.scan_count / max) * 100)}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right tabular-nums text-muted-2">
                        {pct(q.scan_count, allScans)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-auto border-t border-stone px-5 py-3 text-center">
        <Link
          href="/dashboard/qr-codes"
          className={`rounded-full font-body text-[13px] font-medium text-ink underline decoration-lime decoration-2 underline-offset-4 hover:decoration-ink ${FOCUS}`}
        >
          View all codes
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
