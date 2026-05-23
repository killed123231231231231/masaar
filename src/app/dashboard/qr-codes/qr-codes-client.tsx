"use client";

import Link from "next/link";
import {
  BarChart3, Filter, Pencil, Plus, Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import LogoMark from "@/components/logo-mark";
import QrThumb from "@/components/qr-thumb";
import Sidebar, { type SidebarMe } from "@/components/dashboard/sidebar";

export interface QrCardData {
  id: string;
  name: string;
  kind: string;
  content_kind: string;
  destination: string;
  short_id: string | null;
  status: string;
  created_at: string;
  // B5/Item 10 — style fields for real QR thumbnails in the grid.
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
  logo_url: string | null;
}

const STATUS_TINT: Record<string, string> = {
  active: "bg-deep-teal/10 text-deep-teal",
  pending_payment: "bg-terracotta/15 text-terracotta-dark",
  suspended: "bg-charcoal/10 text-charcoal/65",
  expired: "bg-charcoal/10 text-charcoal/55",
};

export default function QrCodesClient({
  qrs,
  counts,
  me,
}: {
  qrs: QrCardData[];
  counts: Record<string, number>;
  me: SidebarMe;
}) {
  // B5/Item 10 — origin is browser-only. Read post-mount and pass down
  // so QrThumb has the right encoded URL for dynamic QRs.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="mx-auto flex max-w-[1440px]">
        <Sidebar me={me} current="qrcodes" />
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <MobileTopBar />
          <PageHeader total={qrs.length} />
          {qrs.length === 0 ? (
            <EmptyState />
          ) : (
            <Grid qrs={qrs} counts={counts} origin={origin} />
          )}
        </main>
      </div>
    </div>
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
      <span className="text-xs text-charcoal/45">QR Codes</span>
    </div>
  );
}

function PageHeader({ total }: { total: number }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your QR codes</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {total} {total === 1 ? "code" : "codes"} total · click any code to edit it or view analytics.
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-deep-teal-dark"
        >
          <Plus className="h-4 w-4" /> Create QR
        </Link>
      </div>
    </div>
  );
}

function Grid({ qrs, counts, origin }: { qrs: QrCardData[]; counts: Record<string, number>; origin: string }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return qrs;
    return qrs.filter(
      (qr) =>
        qr.name.toLowerCase().includes(q) ||
        (qr.short_id ?? "").toLowerCase().includes(q) ||
        qr.destination.toLowerCase().includes(q)
    );
  }, [qrs, query]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/45" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, short link, or destination…"
            className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/15"
          />
        </label>
        <button
          type="button"
          onClick={() => toast("Custom filters coming in Sprint 3")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm font-medium text-charcoal/75 hover:bg-sand-light"
        >
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center text-sm text-charcoal/55">
          No codes match “{query}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <Card key={q.id} q={q} scans={counts[q.id] ?? 0} origin={origin} />
          ))}
        </div>
      )}
    </>
  );
}

function Card({ q, scans, origin }: { q: QrCardData; scans: number; origin: string }) {
  const tint = STATUS_TINT[q.status] ?? STATUS_TINT.active;
  const thumbData =
    q.kind === "dynamic" && q.short_id ? `${origin}/r/${q.short_id}` : q.destination || " ";
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <QrThumb
            size={56}
            style={{
              data: thumbData,
              fgColor: q.fg_color,
              bgColor: q.bg_color,
              gradientColor: q.gradient_color,
              dotStyle: q.dot_style,
              cornerStyle: q.corner_style,
              logoUrl: q.logo_url,
            }}
            className="border border-charcoal/10"
          />
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-semibold text-charcoal">{q.name}</h3>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-charcoal/45">
              {q.kind} · {q.content_kind}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tint}`}>
          {q.status.replace(/_/g, " ")}
        </span>
      </div>

      <p className="mt-3 truncate text-xs text-charcoal/60" title={q.destination}>
        {q.destination}
      </p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-charcoal/55">
        <span>
          {q.short_id ? (
            <>
              <span className="text-charcoal/45">/r/</span>
              <span className="font-mono text-charcoal/70">{q.short_id}</span>
            </>
          ) : (
            <span>Static</span>
          )}
        </span>
        <span className="font-semibold text-charcoal/75">{scans.toLocaleString()} scans</span>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/qr/${q.id}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
        <Link
          href={`/dashboard/qr/${q.id}/analytics`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
        >
          <BarChart3 className="h-3.5 w-3.5" /> Analytics
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
      <LogoMark className="mx-auto h-14 w-14 opacity-30" />
      <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">
        No QR codes yet
      </h3>
      <p className="mt-2 mx-auto max-w-sm text-sm leading-relaxed text-charcoal/60">
        Create your first dynamic QR code and watch scans roll in.
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
