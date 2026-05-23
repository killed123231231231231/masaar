"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3, Crown, Download, Home, LayoutGrid, Link2, LogOut, Megaphone,
  MonitorSmartphone, Plug, QrCode, Settings, Users,
  type LucideIcon,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";

export type SidebarCurrent = "overview" | "analytics" | "qrcodes" | "none";

export interface SidebarMe {
  email: string;
  name: string;
  plan: string;     // "Pro" | "Free"
  qrCount: number;
}

const PLAN_LIMITS: Record<string, number> = { Free: 5, Pro: 5000 };

interface Props {
  me: SidebarMe;
  current: SidebarCurrent;
  /** Per-QR analytics URL when a QR is in context; null on account-level pages
   *  (Analytics item becomes a "create-a-QR-first" toast). */
  analyticsHref?: string | null;
  /** Per-QR CSV export URL; undefined on account-level pages (Reports → Soon). */
  reportsHref?: string;
  /** Where the "Upgrade to Pro" CTA in the Free-plan card goes. */
  upgradeHref?: string;
}

export default function Sidebar({
  me, current, analyticsHref = null, reportsHref, upgradeHref = "/pricing",
}: Props) {
  const limit = PLAN_LIMITS[me.plan] ?? 5;
  const used = Math.min(me.qrCount, limit);
  const usagePct = Math.round((used / limit) * 100);

  type NavSpec =
    | { label: string; icon: LucideIcon; href: string; active?: boolean; soon?: false }
    | { label: string; icon: LucideIcon; href?: undefined; active?: false; soon: true };

  const nav: NavSpec[] = [
    { label: "Overview",     icon: LayoutGrid,        href: "/dashboard", active: current === "overview" },
    analyticsHref
      ? { label: "Analytics", icon: BarChart3,        href: analyticsHref, active: current === "analytics" }
      : { label: "Analytics", icon: BarChart3,        soon: true },
    { label: "QR Codes",     icon: QrCode,            href: "/dashboard/qr-codes", active: current === "qrcodes" },
    { label: "Campaigns",    icon: Megaphone,         soon: true },
    { label: "Destinations", icon: Link2,             soon: true },
    { label: "Audience",     icon: Users,             soon: true },
    { label: "Devices",      icon: MonitorSmartphone, soon: true },
    reportsHref
      ? { label: "Reports",   icon: Download,         href: reportsHref }
      : { label: "Reports",   icon: Download,         soon: true },
    { label: "Integrations", icon: Plug,              soon: true },
    // B5/Item 12 — Settings is now a real page.
    { label: "Settings",     icon: Settings,          href: "/dashboard/settings", active: false },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col bg-deep-teal text-white lg:flex">
      {/* B5/Item 13 — logo click routes to /. Hover affordance keeps the
          chip readable without breaking the brand wordmark layout. */}
      <Link
        href="/"
        title="Back to public site"
        className="group flex items-center gap-2 px-5 py-5 transition-colors hover:bg-white/5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-md bg-white p-1">
          <LogoMark className="h-full w-full" />
        </span>
        <span className="font-display text-base font-bold">
          Masaar <span className="font-arabic text-deep-teal-light">مسار</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((n) => {
          const inner = (
            <span
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                n.active
                  ? "bg-white font-semibold text-deep-teal"
                  : n.soon
                    ? "cursor-not-allowed text-white/45 hover:bg-white/5"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <n.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {n.label}
              </span>
              {n.soon && (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/55">
                  Soon
                </span>
              )}
            </span>
          );
          if (n.href) return <Link key={n.label} href={n.href}>{inner}</Link>;
          return (
            <button
              key={n.label}
              type="button"
              className="block w-full text-left"
              onClick={() => toast("This feature is coming in Sprint 3")}
            >
              {inner}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-xl bg-deep-teal-dark p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-terracotta" />
          <span className="text-sm font-semibold">{me.plan} Plan</span>
        </div>
        <p className="mt-2 text-xs text-white/65">
          {used.toLocaleString()} / {limit.toLocaleString()} QRs used
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-terracotta" style={{ width: `${Math.min(usagePct, 100)}%` }} />
        </div>
        {me.plan === "Free" && (
          <Link
            href={upgradeHref}
            className="mt-3 block rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-deep-teal hover:bg-white/90"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>

      <ProfileChip me={me} />
    </aside>
  );
}

// B5/Item 12 — clickable profile chip with a Settings + Sign out menu.
// Outside-click + Escape dismiss; absolute-positioned popover opens
// above the chip (it sits at the bottom of a tall sidebar).
function ProfileChip({ me }: { me: SidebarMe }) {
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
    <div ref={rootRef} className="relative border-t border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs font-bold uppercase">
          {(me.name?.[0] || me.email?.[0] || "U").toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{me.name}</p>
          <p className="truncate text-[10px] text-white/55">{me.email}</p>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-lg border border-charcoal/10 bg-white text-charcoal shadow-xl"
        >
          <Link
            href="/dashboard/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
          >
            <Home className="h-4 w-4" /> Back to public site
          </Link>
          <form
            action="/auth/signout"
            method="post"
            className="border-t border-charcoal/10"
          >
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-terracotta-dark hover:bg-terracotta/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
