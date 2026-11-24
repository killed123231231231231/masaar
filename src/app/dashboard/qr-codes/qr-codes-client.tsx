"use client";

import Link from "next/link";
import {
  BarChart3, Calendar, ExternalLink, LinkIcon, Download, Lock,
  Mail, MapPin, MoreVertical, Pencil, Phone, Plus,
  Search, Smartphone, Text as TextIcon, UserSquare,
  Wifi, Trash2, QrCode as QrCodeIcon, type LucideIcon,
} from "lucide-react";
import { MessagesIcon, ReviewsIcon } from "@/components/icons/line-icons";
import WhatsAppIcon from "@/components/icons/whatsapp";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import StyledQr from "@/components/styled-qr";
import { createQr } from "@/lib/qr";
import { appUrl } from "@/lib/utils";
import type { SidebarMe } from "@/components/dashboard/sidebar";
import DashboardFrame from "@/components/dashboard/frame";
import Pagination from "@/components/dashboard/pagination";
import {
  Card, EmptyState as EmptyBlock, FOCUS, PageTitle, PrimaryButton,
} from "@/components/dashboard/ui";
import { qrFileName } from "@/lib/file-name";

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
  dot_palette: string[] | null;
  corner_colors: string[] | null;
  palette_options: import("@/lib/palette").PaletteOptions | null;
  /** Locked by the site owner from /admin; the owner cannot switch it on. */
  admin_locked?: boolean;
}

const STATUS_TINT: Record<string, string> = {
  active: "bg-lime text-ink",
  pending_payment: "bg-blush/70 text-ink",
  suspended: "bg-stone text-muted-2",
  expired: "bg-stone text-muted-2",
};

// Friendly label + icon per content_kind enum value. Anything unknown
// falls back to a generic Link affordance.
const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  url: { label: "Website", icon: LinkIcon },
  text: { label: "Text", icon: TextIcon },
  vcard: { label: "vCard", icon: UserSquare },
  wifi: { label: "WiFi", icon: Wifi },
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: MessagesIcon },
  phone: { label: "Phone", icon: Phone },
  whatsapp: { label: "WhatsApp", icon: WhatsAppIcon },
  app_link: { label: "App Link", icon: Smartphone },
  location: { label: "Location", icon: MapPin },
  feedback: { label: "Feedback", icon: ReviewsIcon },
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
    <DashboardFrame me={me} current="qrcodes" className="space-y-6">
      <PageHeader total={qrs.length} />
      {qrs.length === 0 ? (
        <EmptyState />
      ) : (
        <ListBlock qrs={qrs} counts={counts} />
      )}
    </DashboardFrame>
  );
}

function PageHeader({ total }: { total: number }) {
  return (
    <PageTitle
      title="QR codes"
      sub={`${total} ${total === 1 ? "code" : "codes"}. Search, edit, download or open analytics.`}
      right={<PrimaryButton href="/create" icon={Plus}>Create QR code</PrimaryButton>}
    />
  );
}

/* ───────────────────────────── LIST ───────────────────────────── */

const PAGE_SIZE = 10;

function ListBlock({
  qrs,
  counts,
}: {
  qrs: QrCardData[];
  counts: Record<string, number>;
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
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

  // ?page= drives pagination, ?q= keeps the search across reloads and back.
  // Both are written with the History API (Next keeps useSearchParams in
  // sync) so paging and typing never trigger a server round trip.
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const listTop = useRef<HTMLDivElement | null>(null);

  function writeParams(mutate: (sp: URLSearchParams) => void, mode: "push" | "replace") {
    const sp = new URLSearchParams(Array.from(params.entries()));
    mutate(sp);
    const qs = sp.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }

  function onSearch(v: string) {
    setQuery(v);
    writeParams((sp) => {
      if (v.trim()) sp.set("q", v);
      else sp.delete("q");
      sp.delete("page");
    }, "replace");
  }

  function goTo(p: number) {
    writeParams((sp) => {
      if (p <= 1) sp.delete("page");
      else sp.set("page", String(p));
    }, "push");
    listTop.current?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <div ref={listTop} className="flex scroll-mt-6 flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] max-w-md flex-1">
          <span className="sr-only">Search QR codes</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-3" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, short link or destination"
            className="h-11 w-full rounded-full border border-stone-dark bg-white pl-10 pr-4 font-body text-sm text-ink placeholder:text-muted-4 outline-none transition-colors focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          />
        </label>
        <span className="font-body text-[13px] text-muted-3">
          {filtered.length === qrs.length
            ? `${qrs.length} ${qrs.length === 1 ? "code" : "codes"}`
            : `${filtered.length} of ${qrs.length}`}
        </span>
        {/* The placeholder "Filters" button (toast: coming in Sprint 3) was
            removed — a control that goes nowhere reads as broken. It returns
            with the real filtering feature. */}
      </div>

      {filtered.length === 0 ? (
        <Card as="div" className="p-8 text-center font-body text-sm text-muted-2">
          No codes match “{query}”.
        </Card>
      ) : (
        <ul className="rounded-card border border-stone-dark/70 bg-white font-body shadow-card">
          {/* No overflow-hidden on the <ul>: the row 3-dot menu is an
              absolutely positioned dropdown, and clipping it to the list
              box cut the menu off on the last/only row. Corner rounding is
              handled per row (first:/last:) so the card still looks clipped. */}
          {visible.map((q, i) => (
            <ListRow
              key={q.id}
              q={q}
              scans={counts[q.id] ?? 0}
              isLast={i === visible.length - 1}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-[13px] text-muted-3">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <Pagination page={page} pages={pages} onChange={goTo} label="QR code pages" />
        </div>
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
  const adminLocked = q.admin_locked === true;
  const canToggle = !adminLocked && (status === "active" || status === "suspended");
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
      const data = await res.json().catch(() => null);
      toast.error(data?.message || "Couldn’t update status. Try again.");
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
      dotPalette: q.dot_palette,
      cornerColors: q.corner_colors,
      paletteOptions: q.palette_options,
    });
    await qr.download({ name: qrFileName(q.name), extension: "png" });
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 transition first:rounded-t-card last:rounded-b-card sm:flex-nowrap sm:gap-4 sm:px-5 ${
        !isLast ? "border-b border-stone" : ""
      } ${
        // Suspended rows are locked — no hover tint either, so the row
        // doesn't pretend to be interactive while its actions are disabled.
        status === "suspended" ? "opacity-60" : "hover:bg-cream/70"
      }`}
    >
      {/* Thumbnail — the row's visual anchor. A generous, clickable preview
          (same destination as the name) in a clean rounded frame, so a QR is
          recognisable straight from the list. */}
      <Link
        href={`/dashboard/qr/${q.id}`}
        aria-label={`Open QR code ${q.name}`}
        title={locked ? "Inactive. Reactivate to open" : `Open QR code ${q.name}`}
        tabIndex={locked ? -1 : undefined}
        aria-disabled={locked || undefined}
        className={`group/qr block shrink-0 rounded-2xl border border-stone-dark bg-white p-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-card ${FOCUS} ${lockCls}`}
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
            dotPalette={q.dot_palette}
            cornerColors={q.corner_colors}
            paletteOptions={q.palette_options}
            size={84}
            fill
          />
        </div>
      </Link>

      {/* Name + edit shortcut. Tappable on the whole block for fast access. */}
      {/* Phones: name takes the rest of the first line (beside the
          thumbnail) and the actions wrap to a second line under it. */}
      <div className="min-w-0 basis-[calc(100%-90px)] sm:basis-auto sm:flex-[1.4]">
        <p className="hidden text-xs text-muted-3 sm:block">
          QR name
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Link
            href={`/dashboard/qr/${q.id}`}
            className={`truncate rounded font-heading text-[15px] font-semibold text-ink hover:underline ${FOCUS} ${lockCls}`}
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
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-3 hover:bg-stone hover:text-ink ${FOCUS}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-3 sm:hidden">
          <TypeIcon className="h-3.5 w-3.5" aria-hidden />
          {tm.label}
        </p>
        {adminLocked && (
          // Phone widths hide the status column, so say it here too.
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-ink md:hidden">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Locked by the site owner
          </p>
        )}
      </div>

      {/* Destination — hidden under md. */}
      <div className="hidden min-w-0 flex-[1.4] md:block">
        <p className="text-xs text-muted-3">
          Destination
        </p>
        <a
          href={q.destination}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate rounded text-sm text-muted-2 hover:text-ink ${FOCUS} ${lockCls}`}
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
        <p className="text-xs text-muted-3">
          Created
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-2">
          <Calendar className="h-3 w-3 text-muted-3" aria-hidden />
          {fmtCreated(q.created_at)}
        </p>
      </div>

      {/* B5/Audit M2 — chips now have fixed min-widths + centered
          content so their left edges align across all rows. Pre-fix
          the chips were auto-width inline-flex/inline-block, drifting
          ~30px between rows depending on label text ("Website" vs
          "WhatsApp", "active" vs "pending payment"). Fixed-width
          containers + justify-center keeps the column predictable. */}
      <span className="hidden w-32 shrink-0 items-center justify-center gap-1.5 rounded-full bg-stone px-2.5 py-1 text-xs font-medium text-ink sm:inline-flex">
        <TypeIcon className="h-3.5 w-3.5" aria-hidden />
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
                ? "Active. Click to deactivate"
                : "Inactive. Click to activate"
            }
            title={
              isActive
                ? "Active. Click to deactivate"
                : "Inactive. Click to activate"
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${
              isActive ? "bg-ink" : "bg-stone-dark"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform duration-300 ease-out ${
                isActive ? "translate-x-5 bg-lime" : "translate-x-0 bg-white"
              }`}
            />
          </button>
        </div>
      ) : adminLocked ? (
        <span
          className="hidden w-[88px] shrink-0 items-center justify-center gap-1 rounded-full bg-blush/70 px-2 py-1 text-[11px] font-medium text-ink md:inline-flex"
          title="Locked by the site owner. Contact support to have it reviewed."
        >
          <Lock className="h-3 w-3" aria-hidden="true" />
          Locked
        </span>
      ) : (
        <span
          className={`hidden w-[88px] shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-medium capitalize md:inline-block ${statusTint}`}
        >
          {status.replace(/_/g, " ")}
        </span>
      )}

      {/* Scans — prominent pill (getqr style: "163 scans" / "2.2K scans"). */}
      <Link
        href={`/dashboard?qr=${q.id}`}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-lime px-3 max-sm:ml-[90px] text-xs font-medium text-ink transition hover:bg-lime-deep ${FOCUS} ${lockCls}`}
        title={locked ? "Inactive. Reactivate to view analytics" : "Open analytics"}
        tabIndex={locked ? -1 : undefined}
        aria-disabled={locked || undefined}
      >
        <BarChart3 className="h-3.5 w-3.5" aria-hidden />
        <span className="tabular-nums">{formatScans(scans)}</span> scans
      </Link>

      {/* Download — bordered so it clearly reads as a button. Styled PNG that
          matches the builder preview. */}
      <button
        type="button"
        onClick={downloadStyled}
        disabled={locked}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-stone-dark bg-white text-ink transition hover:bg-stone disabled:pointer-events-none disabled:opacity-40 ${FOCUS}`}
        title={locked ? "Inactive. Reactivate to download" : "Download PNG"}
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
        `Delete “${name}”? This can't be undone: the QR stops working and its scans are removed.`
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
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-2 hover:bg-stone hover:text-ink ${FOCUS}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-2xl border border-stone-dark bg-white p-1.5 shadow-float"
        >
          {locked ? (
            <span
              role="menuitem"
              aria-disabled
              className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-4"
            >
              <Pencil className="h-4 w-4" /> Edit
            </span>
          ) : (
            <Link
              href={`/dashboard/qr/${id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
          {locked ? (
            <span
              role="menuitem"
              aria-disabled
              className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-4"
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </span>
          ) : (
            <Link
              href={`/dashboard?qr=${id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={deleting}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-blush/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-60"
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
    <Card className="py-6">
      <EmptyBlock
        icon={QrCodeIcon}
        title="No QR codes yet"
        body="Create your first dynamic QR code. You can change where it points after printing."
        action={<PrimaryButton href="/create" icon={Plus}>Create QR code</PrimaryButton>}
      />
    </Card>
  );
}
