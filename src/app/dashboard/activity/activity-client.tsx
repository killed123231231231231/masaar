"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Search } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import Sidebar, { type SidebarMe } from "@/components/dashboard/sidebar";
import { PeriodPills, fmtTime } from "@/components/dashboard/widgets";
import type { AccountActivityPage, AccountRecentScan, Period } from "@/lib/analytics";

export default function ActivityClient({
  activity,
  me,
  period,
}: {
  activity: AccountActivityPage;
  me: SidebarMe;
  period: Period;
}) {
  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="activity" />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <MobileTopBar />
          <PageHeader total={activity.totalCount} period={period} />
          <ListBlock activity={activity} period={period} />
        </main>
      </div>
    </div>
  );
}

function MobileTopBar() {
  return (
    <div className="flex items-center justify-between lg:hidden">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/65 hover:text-deep-teal">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-deep-teal p-1">
          <LogoMark className="h-full w-full brightness-0 invert" />
        </span>
        Dashboard
      </Link>
      <span className="text-xs text-charcoal/45">Activity</span>
    </div>
  );
}

function PageHeader({ total, period }: { total: number; period: Period }) {
  const exportHref = `/api/account/scans.csv?period=${period}`;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {total.toLocaleString()} scan {total === 1 ? "event" : "events"} in this period across every QR.
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm font-medium text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>
      <div className="mt-4">
        <PeriodPills current={period} />
      </div>
    </div>
  );
}

function ListBlock({ activity, period }: { activity: AccountActivityPage; period: Period }) {
  const [query, setQuery] = useState("");
  // Client-side filter — narrows the current page's 50 rows by QR name.
  // For full-history search a server-side filter would be needed; logged
  // as a follow-up in the report.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activity.scans;
    return activity.scans.filter(
      (s) =>
        s.qr_name.toLowerCase().includes(q) ||
        (s.qr_destination ?? "").toLowerCase().includes(q)
    );
  }, [activity.scans, query]);

  if (activity.totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
        <LogoMark className="mx-auto h-14 w-14 opacity-30" />
        <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">
          No activity in this period
        </h3>
        <p className="mt-2 mx-auto max-w-sm text-sm leading-relaxed text-charcoal/60">
          Once your QRs are scanned, every event lands here in real time.
        </p>
        <Link
          href="/dashboard/qr-codes"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-deep-teal-dark"
        >
          View your QR codes
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/45" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter this page by QR name or destination…"
            className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/15"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-sand-light/40 text-[10px] uppercase tracking-wider text-charcoal/55">
              <tr className="text-left">
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">QR</th>
                <th className="px-5 py-3 font-semibold">Destination</th>
                <th className="px-5 py-3 font-semibold">Where</th>
                <th className="px-5 py-3 font-semibold">Device</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <ActivityRow key={s.id} s={s} />
              ))}
              {filtered.length === 0 && query && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-charcoal/55">
                    No rows on this page match “{query}”. Try clearing the search or changing the period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination activity={activity} period={period} />
    </>
  );
}

function ActivityRow({ s }: { s: AccountRecentScan }) {
  return (
    <tr className="border-t border-charcoal/5 hover:bg-sand-light/30">
      <td className="px-5 py-3 whitespace-nowrap text-charcoal/70">{fmtTime(s.scanned_at)}</td>
      <td className="px-5 py-3 text-charcoal/70">
        {s.qr_id ? (
          <Link
            href={`/dashboard/qr/${s.qr_id}/analytics`}
            className="font-medium text-charcoal hover:text-deep-teal"
            title={s.qr_name}
          >
            {s.qr_name}
          </Link>
        ) : (
          <span className="text-charcoal/45">Unknown</span>
        )}
      </td>
      <td className="px-5 py-3 text-charcoal/65">
        {s.qr_destination ? (
          <a
            href={s.qr_destination}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[280px] items-center gap-1.5 truncate hover:text-deep-teal"
            title={s.qr_destination}
          >
            <span className="truncate">{s.qr_destination}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="px-5 py-3 text-charcoal/70">
        {[s.city, s.country].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-5 py-3 capitalize text-charcoal/70">{s.device_type || "—"}</td>
    </tr>
  );
}

function Pagination({ activity, period }: { activity: AccountActivityPage; period: Period }) {
  const totalPages = Math.max(1, Math.ceil(activity.totalCount / activity.pageSize));
  if (totalPages <= 1) return null;

  const link = (n: number) => `/dashboard/activity?period=${period}&page=${n}`;
  const prev = Math.max(1, activity.page - 1);
  const next = Math.min(totalPages, activity.page + 1);

  return (
    <nav className="flex items-center justify-between gap-3 text-sm text-charcoal/65" aria-label="Activity pagination">
      <span>
        Page <span className="font-semibold text-charcoal">{activity.page}</span> of{" "}
        <span className="font-semibold text-charcoal">{totalPages}</span>
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={link(prev)}
          aria-disabled={activity.page === 1}
          className={`inline-flex items-center gap-1 rounded-md border border-charcoal/15 bg-white px-3 py-1.5 font-medium ${
            activity.page === 1
              ? "pointer-events-none opacity-40"
              : "hover:bg-sand-light hover:text-deep-teal"
          }`}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Link>
        <Link
          href={link(next)}
          aria-disabled={!activity.hasMore}
          className={`inline-flex items-center gap-1 rounded-md border border-charcoal/15 bg-white px-3 py-1.5 font-medium ${
            !activity.hasMore
              ? "pointer-events-none opacity-40"
              : "hover:bg-sand-light hover:text-deep-teal"
          }`}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
