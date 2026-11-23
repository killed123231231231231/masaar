"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Download, ExternalLink, Monitor, ScanLine, Search, Smartphone, Tablet,
  type LucideIcon,
} from "lucide-react";
import type { SidebarMe } from "@/components/dashboard/sidebar";
import DashboardFrame from "@/components/dashboard/frame";
import {
  Card, EmptyState, FOCUS, OUTLINE_BTN, PageTitle, PrimaryButton,
} from "@/components/dashboard/ui";
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
    <DashboardFrame me={me} current="activity" className="space-y-6">
      <PageHeader total={activity.totalCount} period={period} />
      <ListBlock activity={activity} period={period} />
    </DashboardFrame>
  );
}

function PageHeader({ total, period }: { total: number; period: Period }) {
  const exportHref = `/api/account/scans.csv?period=${period}`;
  return (
    <div className="space-y-4">
      <PageTitle
        title="Activity"
        sub={`${total.toLocaleString()} ${total === 1 ? "scan" : "scans"} in this period across all your QR codes. Times are Riyadh time.`}
        right={
          <a href={exportHref} className={OUTLINE_BTN}>
            <Download className="h-4 w-4" aria-hidden /> Export CSV
          </a>
        }
      />
      <PeriodPills current={period} />
    </div>
  );
}

function deviceIcon(d: string | null): LucideIcon {
  const l = (d ?? "").toLowerCase();
  if (l.includes("mobile")) return Smartphone;
  if (l.includes("tablet")) return Tablet;
  return Monitor;
}

function ListBlock({ activity, period }: { activity: AccountActivityPage; period: Period }) {
  const [query, setQuery] = useState("");
  // Client-side filter — narrows the current page's 50 rows by QR name or
  // destination.
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
      <Card className="py-6">
        <EmptyState
          icon={ScanLine}
          title="No scans in this period"
          body="Every scan of your QR codes is listed here as it happens."
          action={<PrimaryButton href="/dashboard/qr-codes">View your QR codes</PrimaryButton>}
        />
      </Card>
    );
  }

  return (
    <>
      <label className="relative block max-w-md">
        <span className="sr-only">Filter this page</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-3" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter this page by QR name or destination"
          className="h-11 w-full rounded-full border border-stone-dark bg-white pl-10 pr-4 font-body text-sm text-ink placeholder:text-muted-4 outline-none transition-colors focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
        />
      </label>

      <Card className="overflow-hidden">
        {/* md+: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] font-body text-[13px]">
            <thead className="border-b border-stone bg-cream">
              <tr className="text-left">
                {["Time", "QR code", "Destination", "Location", "Device"].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-5 py-3 text-xs font-medium text-muted-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {filtered.map((s) => (
                <ActivityRow key={s.id} s={s} />
              ))}
              {filtered.length === 0 && query && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-2">
                    No rows on this page match “{query}”. Clear the search or change the period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* <md: stacked cards */}
        <ul className="divide-y divide-stone font-body md:hidden">
          {filtered.map((s) => (
            <ActivityCard key={s.id} s={s} />
          ))}
          {filtered.length === 0 && query && (
            <li className="px-5 py-8 text-center text-sm text-muted-2">
              No rows on this page match “{query}”.
            </li>
          )}
        </ul>
      </Card>

      <Pagination activity={activity} period={period} />
    </>
  );
}

function ActivityRow({ s }: { s: AccountRecentScan }) {
  const Dev = deviceIcon(s.device_type);
  return (
    <tr className="hover:bg-cream/60">
      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-2">{fmtTime(s.scanned_at, { year: true })}</td>
      <td className="px-5 py-3">
        {s.qr_id ? (
          <Link
            href={`/dashboard?qr=${s.qr_id}`}
            className={`rounded font-medium text-ink hover:underline ${FOCUS}`}
            title={s.qr_name}
          >
            {s.qr_name}
          </Link>
        ) : (
          <span className="text-muted-3">Unknown</span>
        )}
      </td>
      <td className="px-5 py-3 text-muted-2">
        {s.qr_destination ? (
          <a
            href={s.qr_destination}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex max-w-[280px] items-center gap-1.5 truncate rounded hover:text-ink ${FOCUS}`}
            title={s.qr_destination}
          >
            <span className="truncate">{s.qr_destination}</span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="px-5 py-3 text-muted-2">
        {[s.city, s.country].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-5 py-3 capitalize text-muted-2">
        <span className="inline-flex items-center gap-1.5">
          <Dev className="h-3.5 w-3.5 text-ink" strokeWidth={1.75} aria-hidden />
          {s.device_type || "—"}
        </span>
      </td>
    </tr>
  );
}

function ActivityCard({ s }: { s: AccountRecentScan }) {
  const Dev = deviceIcon(s.device_type);
  return (
    <li className="px-5 py-3.5">
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
      {s.qr_destination && (
        <p className="mt-0.5 truncate text-xs text-muted-2" title={s.qr_destination}>{s.qr_destination}</p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-xs capitalize text-muted-3">
        <Dev className="h-3.5 w-3.5 text-ink" strokeWidth={1.75} aria-hidden />
        {s.device_type || "Unknown"} · {[s.city, s.country].filter(Boolean).join(", ") || "Unknown"}
      </p>
    </li>
  );
}

function Pagination({ activity, period }: { activity: AccountActivityPage; period: Period }) {
  const totalPages = Math.max(1, Math.ceil(activity.totalCount / activity.pageSize));
  if (totalPages <= 1) return null;

  const link = (n: number) => `/dashboard/activity?period=${period}&page=${n}`;
  const prev = Math.max(1, activity.page - 1);
  const next = Math.min(totalPages, activity.page + 1);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 font-body text-sm text-muted-2" aria-label="Activity pagination">
      <span>
        Page <span className="font-medium text-ink">{activity.page}</span> of{" "}
        <span className="font-medium text-ink">{totalPages}</span>
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={link(prev)}
          aria-disabled={activity.page === 1}
          className={`${OUTLINE_BTN} ${activity.page === 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
        </Link>
        <Link
          href={link(next)}
          aria-disabled={!activity.hasMore}
          className={`${OUTLINE_BTN} ${!activity.hasMore ? "pointer-events-none opacity-40" : ""}`}
        >
          Next <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
