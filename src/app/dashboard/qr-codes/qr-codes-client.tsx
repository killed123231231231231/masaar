"use client";

import Link from "next/link";
import {
  BarChart3, Calendar, ExternalLink, LinkIcon, Download,
  Mail, MapPin, MessageSquare, MoreVertical, Pencil, Phone, Plus,
  Search, Smartphone, Text as TextIcon, UserSquare,
  Wifi, Trash2, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LogoMark from "@/components/logo-mark";
import StyledQr from "@/components/styled-qr";
import { createQr } from "@/lib/qr";
import { appUrl } from "@/lib/utils";
import Sidebar, { type SidebarMe } from "@/components/dashboard/sidebar";
import MobileDashboardNav from "@/components/dashboard/mobile-dashboard-nav";

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

// getqr-style compact scan count: 0, 2, 163, 2.2K, 12K, 1.2M.
function formatScans(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }
  const m = n / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
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
          <MobileDashboardNav me={me} current="qrcodes" />
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
        {/* The placeholder "Filters" button (toast: coming in Sprint 3) was
            removed — a control that goes nowhere reads as broken. It returns
            with the real filtering feature. */}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center text-sm text-charcoal/55">
          No codes match “{query}”.
        </p>
      ) : (
        <ul className="rounded-2xl border border-charcoal/10 bg-white shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
          {/* No overflow-hidden on the <ul>: the row 3-dot menu is an
              absolutely positioned dropdown, and clipping it to the list
              box cut the menu off on the last/only row. Corner rounding is
              handled per row (first:/last:) so the card still looks clipped. */}
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
  const router = useRouter();
  const tm = typeMeta(q.content_kind);
  const TypeIcon = tm.icon;

  // Local (optimistic) status so the Active/Inactive toggle greys the row
  // instantly; the server syncs on router.refresh().
  const [status, setStatus] = useState(q.status);
  const [toggling, setToggling] = useState(false);
  const canToggle = status === "active" || status === "suspended";
  const isActive = status === "active";
  const statusTint = STATUS_TINT[status] ?? STATUS_TINT.active;
  // When suspended the row is locked — open / edit / download / analytics are
  // all disabled (the QR is off); only the toggle (reactivate) + Delete stay.
  const locked = status === "suspended";
  const lockCls = locked ? "pointer-events-none" : "";

  async function toggleStatus() {
    if (!canToggle || toggling) return;
    const next = isActive ? "suspended" : "active";
    const prev = status;
    setStatus(next);
    setToggling(true);
    const res = await fetch("/api/qr", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: q.id, status: next }),
    });
    setToggling(false);
    if (!res.ok) {
      setStatus(prev);
      toast.error("Couldn’t update status. Try again.");
      return;
    }
    toast.success(next === "active" ? "QR is now active" : "QR is now inactive");
    router.refresh();
  }

  // What the QR encodes: dynamic → the /r short link; static → its payload.
  const qrData =
    q.kind === "dynamic" && q.short_id
      ? `${appUrl()}/r/${q.short_id}`
      : q.destination || " ";

  // C2 — styled client-side download (dot-style/gradient/logo), matching
  // the builder preview, instead of the plain server render.png.
  async function downloadStyled() {
    const qr = await createQr({
      data: qrData,
      width: 1024,
      height: 1024,
      fgColor: q.fg_color,
      bgColor: q.bg_color,
      gradientColor: q.gradient_color,
      dotStyle: q.dot_style,
      cornerStyle: q.corner_style,
      logoUrl: q.logo_url,
    });
    await qr.download({ name: q.name || "masaar-qr", extension: "png" });
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition first:rounded-t-2xl last:rounded-b-2xl sm:flex-nowrap sm:gap-4 sm:px-5 ${
        !isLast ? "border-b border-charcoal/5" : ""
      } ${
        // Suspended rows are locked — no hover tint either, so the row
        // doesn't pretend to be interactive while its actions are disabled.
        status === "suspended" ? "opacity-55" : "hover:bg-sand-light/40"
      }`}
    >
      {/* Thumbnail — the row's visual anchor. A generous, clickable preview
          (same destination as the name) in a clean rounded frame, so a QR is
          recognisable straight from the list. */}
      <Link
        href={`/dashboard/qr/${q.id}`}
        aria-label={`Open QR code ${q.name}`}
        title={locked ? "Inactive — reactivate to open" : `Open QR code ${q.name}`}
        tabIndex={locked ? -1 : undefined}
        aria-disabled={locked || undefined}
        className={`group/qr block shrink-0 rounded-lg border border-charcoal/10 bg-white p-1 shadow-sm transition-all duration-200 hover:border-deep-teal/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40 ${lockCls}`}
      >
        <div
          className={`h-16 w-16 transition group-hover/qr:scale-[1.04] lg:h-[72px] lg:w-[72px] ${
            status === "suspended" ? "grayscale" : ""
          }`}
        >
          <StyledQr
            qrId={q.id}
            data={qrData}
            fgColor={q.fg_color}
            bgColor={q.bg_color}
            gradientColor={q.gradient_color}
            dotStyle={q.dot_style}
            cornerStyle={q.corner_style}
            logoUrl={q.logo_url}
            size={84}
            fill
          />
        </div>
      </Link>

      {/* Name + edit shortcut. Tappable on the whole block for fast access. */}
      <div className="min-w-0 flex-[1.4]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/45">
          QR name
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Link
            href={`/dashboard/qr/${q.id}`}
            className={`truncate text-sm font-semibold text-charcoal hover:text-deep-teal ${lockCls}`}
            title={q.name}
            tabIndex={locked ? -1 : undefined}
            aria-disabled={locked || undefined}
          >
            {q.name}
          </Link>
          {!locked && (
            // A real-sized touch target (36px) — the old bare 12px icon was
            // nearly impossible to hit on touch screens.
            <Link
              href={`/dashboard/qr/${q.id}`}
              aria-label="Edit QR name"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-charcoal/45 hover:bg-sand-light hover:text-deep-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal/40"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          )}
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
          className={`mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-charcoal/65 hover:text-deep-teal ${lockCls}`}
          title={q.destination}
          tabIndex={locked ? -1 : undefined}
          aria-disabled={locked || undefined}
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

      {/* B5/Audit M2 — chips now have fixed min-widths + centered
          content so their left edges align across all rows. Pre-fix
          the chips were auto-width inline-flex/inline-block, drifting
          ~30px between rows depending on label text ("Website" vs
          "WhatsApp", "active" vs "pending payment"). Fixed-width
          containers + justify-center keeps the column predictable. */}
      <span className="hidden w-32 shrink-0 items-center justify-center gap-1.5 rounded-md bg-sand-light px-2 py-1 text-xs font-medium text-charcoal/70 sm:inline-flex">
        <TypeIcon className="h-3.5 w-3.5 text-deep-teal" />
        {tm.label}
      </span>

      {/* Active/Inactive toggle. An animated iOS-style switch — the knob
          slides and the track colour fades on flip (300ms). Inactive
          (suspended) also greys the whole row; a scan of a suspended QR
          lands on /expired. pending_payment / draft fall back to a chip. */}
      {canToggle ? (
        <div className="hidden w-[88px] shrink-0 items-center justify-center md:flex">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={toggling}
            role="switch"
            aria-checked={isActive}
            aria-label={
              isActive
                ? "Active — click to deactivate"
                : "Inactive — click to activate"
            }
            title={
              isActive
                ? "Active — click to deactivate"
                : "Inactive — click to activate"
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive ? "bg-deep-teal" : "bg-charcoal/25"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      ) : (
        <span
          className={`hidden w-[88px] shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider md:inline-block ${statusTint}`}
        >
          {status.replace(/_/g, " ")}
        </span>
      )}

      {/* Scans — prominent pill (getqr style: "163 scans" / "2.2K scans"). */}
      <Link
        href={`/dashboard?qr=${q.id}`}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-deep-teal/10 px-2.5 py-1.5 text-xs font-bold text-deep-teal transition hover:bg-deep-teal/15 ${lockCls}`}
        title={locked ? "Inactive — reactivate to view analytics" : "Open analytics"}
        tabIndex={locked ? -1 : undefined}
        aria-disabled={locked || undefined}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        {formatScans(scans)} scans
      </Link>

      {/* Download — bordered so it clearly reads as a button. Styled PNG that
          matches the builder preview. */}
      <button
        type="button"
        onClick={downloadStyled}
        disabled={locked}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-charcoal/15 bg-white text-charcoal/60 shadow-sm transition hover:border-deep-teal/40 hover:bg-sand-light hover:text-deep-teal disabled:pointer-events-none disabled:opacity-40"
        title={locked ? "Inactive — reactivate to download" : "Download PNG"}
        aria-label={`Download ${q.name} as PNG`}
      >
        <Download className="h-4 w-4" />
      </button>

      <RowMenu id={q.id} locked={locked} name={q.name} />
    </li>
  );
}

/* ───────────────────────── ROW 3-DOT MENU ───────────────────────── */

function RowMenu({
  id,
  locked = false,
  name,
}: {
  id: string;
  locked?: boolean;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  async function handleDelete() {
    // Name the QR in the confirm — "Delete this QR code?" gave no clue WHICH
    // one was about to vanish for users juggling several codes.
    if (
      !window.confirm(
        `Delete “${name}”? This can't be undone — the QR stops working and its scans are removed.`
      )
    ) {
      return;
    }
    setDeleting(true);
    const res = await fetch("/api/qr", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(false);
    setOpen(false);
    if (!res.ok) {
      toast.error("Couldn’t delete the QR. Try again.");
      return;
    }
    toast.success("QR deleted");
    router.refresh();
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // ARIA menu pattern — Arrow/Home/End cycle focus through the enabled
      // items (Tab still works; this adds the expected keyboard behaviour).
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      const items = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled])'
        ) ?? []
      );
      if (items.length === 0) return;
      e.preventDefault();
      const idx = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === "Home") next = 0;
      else if (e.key === "End") next = items.length - 1;
      else if (idx === -1) next = e.key === "ArrowDown" ? 0 : items.length - 1;
      else if (e.key === "ArrowDown") next = (idx + 1) % items.length;
      else next = (idx - 1 + items.length) % items.length;
      items[next]?.focus();
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
          {locked ? (
            <span
              role="menuitem"
              aria-disabled
              className="flex cursor-not-allowed items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/35"
            >
              <Pencil className="h-4 w-4" /> Edit
            </span>
          ) : (
            <Link
              href={`/dashboard/qr/${id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
          {locked ? (
            <span
              role="menuitem"
              aria-disabled
              className="flex cursor-not-allowed items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/35"
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </span>
          ) : (
            <Link
              href={`/dashboard?qr=${id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={deleting}
            className="flex w-full items-center gap-2 border-t border-charcoal/10 px-3 py-2.5 text-sm font-medium text-terracotta-dark hover:bg-terracotta/10 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting…" : "Delete"}
          </button>
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

