"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity, Crown, Home, LayoutGrid, LogOut, QrCode, Settings, UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";

// B5/Fix 20 — sidebar nav slimmed to 5 items. Aspirational stubs
// (Campaigns / Destinations / Audience / Devices / Reports /
// Integrations) removed entirely; AI Menu Builder is a real nav item
// (placeholder page until Session F lands the actual builder); Activity
// is the new home for what used to be the Overview's Recent Activity
// table (Fix 23).
export type SidebarCurrent =
  | "overview"
  | "qrcodes"
  | "menu"
  | "activity"
  | "settings"
  | "none";

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
  /** Where the "Upgrade to Pro" CTA in the Free-plan card goes. */
  upgradeHref?: string;
  /**
   * Per-QR analytics URL — accepted but unused after Fix 20 (the
   * Analytics nav item is gone). Kept as an optional prop so existing
   * callers compile without edits; will be dropped in a follow-up
   * cleanup.
   */
  analyticsHref?: string | null;
  /** Same story as analyticsHref — accepted but unused. */
  reportsHref?: string;
}

export default function Sidebar({
  me, current, upgradeHref = "/pricing",
}: Props) {
  const limit = PLAN_LIMITS[me.plan] ?? 5;
  const used = Math.min(me.qrCount, limit);
  const usagePct = Math.round((used / limit) * 100);

  type NavSpec = { label: string; icon: LucideIcon; href: string; active: boolean };

  const nav: NavSpec[] = [
    { label: "Overview",        icon: LayoutGrid,      href: "/dashboard",            active: current === "overview" },
    { label: "QR Codes",        icon: QrCode,          href: "/dashboard/qr-codes",   active: current === "qrcodes" },
    { label: "AI Menu Builder", icon: UtensilsCrossed, href: "/dashboard/menu",       active: current === "menu" },
    { label: "Activity",        icon: Activity,        href: "/dashboard/activity",   active: current === "activity" },
    { label: "Settings",        icon: Settings,        href: "/dashboard/settings",   active: current === "settings" },
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
        {nav.map((n) => (
          <Link key={n.label} href={n.href}>
            <span
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                n.active
                  ? "bg-white font-semibold text-deep-teal"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <n.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {n.label}
            </span>
          </Link>
        ))}
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
