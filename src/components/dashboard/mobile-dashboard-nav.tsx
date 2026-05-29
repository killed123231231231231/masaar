"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Activity,
  Crown,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  QrCode,
  Settings,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";
import type { SidebarCurrent, SidebarMe } from "@/components/dashboard/sidebar";

const PLAN_LIMITS: Record<string, number> = { Free: 5, Pro: 5000 };

/**
 * C2 — mobile dashboard nav. The desktop Sidebar is `hidden lg:flex`, so
 * below 1024px there was no way to move between dashboard sections or
 * sign out (each page only had a "back to Dashboard" bar). This renders
 * the `lg:hidden` top bar (logo + hamburger) on every dashboard surface
 * and a slide-in drawer mirroring the Sidebar (full nav + plan usage +
 * account + sign out). Replaces the six bespoke per-page mobile bars.
 */
export default function MobileDashboardNav({
  me,
  current,
}: {
  me: SidebarMe;
  current: SidebarCurrent;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const limit = PLAN_LIMITS[me.plan] ?? 5;
  const used = Math.min(me.qrCount, limit);
  const usagePct = Math.round((used / limit) * 100);

  const nav: { label: string; icon: LucideIcon; href: string; active: boolean }[] = [
    { label: "Overview", icon: LayoutGrid, href: "/dashboard", active: current === "overview" },
    { label: "QR Codes", icon: QrCode, href: "/dashboard/qr-codes", active: current === "qrcodes" },
    { label: "AI Menu Builder", icon: UtensilsCrossed, href: "/dashboard/menu", active: current === "menu" },
    { label: "Activity", icon: Activity, href: "/dashboard/activity", active: current === "activity" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings", active: current === "settings" },
  ];

  const drawer = (
    <div
      className="fixed inset-0 z-[90] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard menu"
    >
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-deep-teal text-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="font-display text-base font-bold">
            Masaar <span className="font-arabic text-deep-teal-light">مسار</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {nav.map((n) => (
            <Link key={n.label} href={n.href} onClick={() => setOpen(false)}>
              <span
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
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
          <Link
            href="/create"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-terracotta px-3 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-dark"
          >
            <Plus className="h-4 w-4" /> Create QR Code
          </Link>
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
            <div
              className="h-full rounded-full bg-terracotta"
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
        </div>

        <div className="border-t border-white/10 px-3 py-3">
          <p className="truncate px-2 pb-2 text-xs text-white/55">{me.email}</p>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <Home className="h-4 w-4" /> Public site
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4 flex items-center justify-between lg:hidden">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/65 hover:text-deep-teal"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-deep-teal p-1">
          <LogoMark className="h-full w-full brightness-0 invert" />
        </span>
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-lg text-charcoal/70 hover:bg-sand-light"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mounted && open && createPortal(drawer, document.body)}
    </div>
  );
}
