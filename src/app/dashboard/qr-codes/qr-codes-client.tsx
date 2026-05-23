"use client";

import Link from "next/link";
import {
  Activity, BarChart3, Calendar, ExternalLink, Filter, LinkIcon, Download,
  Mail, MapPin, MessageSquare, MoreVertical, Pencil, Phone, Plus,
  Search, Smartphone, Text as TextIcon, UserSquare,
  Wifi, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Friendly label + icon per content_kind enum value. Anything unknown
// falls back to a generic Link affordance.
const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  url: { label: "Website", icon: LinkIcon },
  text: { label: "Text", icon: TextIcon },
  vcard: { label: "vCard", icon: UserSquare },
  wifi: { label: "WiFi", icon: Wifi },
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: MessageSquare },
  phone: { label: "Phone", icon: Phone },
  whatsapp: { label: "WhatsApp", icon: MessageSquare },
  app_link: { label: "App Link", icon: Smartphone },
  location: { label: "Location", icon: MapPin },
};

function typeMeta(k: string): { label: string; icon: LucideIcon } {
  return TYPE_META[k] ?? { label: k.replace(/_/g, " "), icon: LinkIcon };
}

function fmtCreated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function QrCodesClient({
  qrs,
  counts,
  me,
}: {
  qrs: QrCardData[];
  counts: Record<string, number>;
  me: SidebarMe;
}) {
  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="qrcodes" />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <MobileTopBar />
          <PageHeader total={qrs.length} />
          {qrs.length === 0 ? (
            <EmptyState />
          ) : (
            <ListBlock qrs={qrs} counts={counts} />
          )}
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
      <span className="text-xs text-charcoal/45">QR Codes</span>
    </div>
  );
}

function PageHeader({ total }: { total: number }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your QR codes</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {total} {total === 1 ? "code" : "codes"} total · search, edit, or jump into per-QR analytics.
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

/* ───────────────────────────── LIST ───────────────────────────── */

function ListBlock({
  qrs,
  counts,
}: {
  qrs: QrCardData[];
  counts: Record<string, number>;
}) {
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
      <div className="flex flex-wrap items-center gap-2">
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
        <ul className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
          {filtered.map((q, i) => (
            <ListRow
              key={q.id}
              q={q}
              scans={counts[q.id] ?? 0}
              isLast={i === filtered.length - 1}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function ListRow({
  q,
  scans,
  isLast,
}: {
  q: QrCardData;
  scans: number;
  isLast: boolean;
}) {
  const tm = typeMeta(q.content_kind);
  const TypeIcon = tm.icon;
  const statusTint = STATUS_TINT[q.status] ?? STATUS_TINT.active;

  return (
    <li
      className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-sand-light/40 sm:px-5 ${
        !isLast ? "border-b border-charcoal/5" : ""
      }`}
    >
      {/* Thumbnail — server-rendered PNG via /api/qr/<id>/render.png. */}
      <QrThumb
        qrId={q.id}
        bgColor={q.bg_color}
        size={56}
        className="border border-charcoal/10"
      />

      {/* Name + edit shortcut. Tappable on the whole block for fast access. */}
      <div className="min-w-0 flex-[1.4]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/45">
          QR name
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Link
            href={`/dashboard/qr/${q.id}`}
            className="truncate text-sm font-semibold text-charcoal hover:text-deep-teal"
            title={q.name}
          >
            {q.name}
          </Link>
          <Link
            href={`/dashboard/qr/${q.id}`}
            aria-label="Edit name"
            className="shrink-0 text-charcoal/35 hover:text-deep-teal"
          >
            <Pencil className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Destination — hidden under md. */}
      <div className="hidden min-w-0 flex-[1.4] md:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/45">
          Destination
        </p>
        <a
          href={q.destination}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-charcoal/65 hover:text-deep-teal"
          title={q.destination}
        >
          <span className="truncate">{q.destination}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>

      {/* Created — hidden under lg. */}
      <div className="hidden w-28 shrink-0 lg:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/45">
          Created
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-charcoal/65">
          <Calendar className="h-3 w-3 text-charcoal/40" />
          {fmtCreated(q.created_at)}
        </p>
      </div>

      {/* Type chip — hidden under sm. */}
      <span className="hidden shrink-0 items-center gap-1.5 rounded-md bg-sand-light px-2 py-1 text-xs font-medium text-charcoal/70 sm:inline-flex">
        <TypeIcon className="h-3.5 w-3.5 text-deep-teal" />
        {tm.label}
      </span>

      {/* Status — hidden under md. */}
      <span
        className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider md:inline-block ${statusTint}`}
      >
        {q.status.replace(/_/g, " ")}
      </span>

      {/* Scans badge */}
      <Link
        href={`/dashboard/qr/${q.id}/analytics`}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-deep-teal/10 px-2 py-1 text-xs font-bold text-deep-teal hover:bg-deep-teal/15"
        title="Open analytics"
      >
        <Activity className="h-3 w-3" />
        {scans.toLocaleString()}
      </Link>

      {/* Download */}
      <a
        href={`/api/qr/${q.id}/render.png?download=1&size=1024`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-charcoal/55 hover:bg-sand-light hover:text-deep-teal"
        title="Download PNG"
        aria-label="Download PNG"
      >
        <Download className="h-4 w-4" />
      </a>

      <RowMenu id={q.id} />
    </li>
  );
}

/* ───────────────────────── ROW 3-DOT MENU ───────────────────────── */

function RowMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-charcoal/55 hover:bg-sand-light hover:text-deep-teal"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-charcoal/10 bg-white shadow-xl"
        >
          <Link
            href={`/dashboard/qr/${id}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <Link
            href={`/dashboard/qr/${id}/analytics`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
          >
            <BarChart3 className="h-4 w-4" /> Analytics
          </Link>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── EMPTY ───────────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
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

