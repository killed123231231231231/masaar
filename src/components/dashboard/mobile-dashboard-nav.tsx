"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Home, LogOut, Menu, Plus, X } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import { PlanCard } from "@/components/dashboard/sidebar";
import {
  NAV, initials,
  type SidebarCurrent, type SidebarMe,
} from "@/components/dashboard/nav";

const RING = "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

/**
 * C2 — mobile dashboard nav. The desktop Sidebar is `hidden lg:flex`, so
 * below 1024px this renders a top bar (logo + create + hamburger) on every
 * dashboard surface and a slide-in ink drawer mirroring the Sidebar (full nav,
 * plan usage, account, sign out).
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

  const showName = me.name && me.name !== me.email;

  const drawer = (
    <div
      className="fixed inset-0 z-[90] font-body lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard menu"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-0 top-0 flex h-full w-[84%] max-w-xs flex-col overflow-y-auto bg-ink text-white shadow-float">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="flex items-center gap-2.5">
            <LogoMark tone="light" className="h-7 w-7" />
            <span className="font-heading text-lg font-extrabold tracking-[-0.03em]">Vertexa QR</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className={`grid h-10 w-10 place-items-center rounded-full text-white/70 hover:bg-white/10 ${RING}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3">
          <Link
            href="/create"
            onClick={() => setOpen(false)}
            className={`group flex h-11 items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink hover:bg-stone ${RING}`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-lime">
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            Create QR code
          </Link>
        </div>

        <nav aria-label="Dashboard" className="mt-5 flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = n.key === current;
            return (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-full px-4 text-[15px] transition-colors ${RING} ${
                  active ? "bg-lime font-medium text-ink" : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <n.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <PlanCard me={me} className="mx-3 my-3" />

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3 px-2 pb-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime font-heading text-[13px] font-bold text-ink">
              {initials(me)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{showName ? me.name : me.email}</span>
              {showName && <span className="block truncate text-xs text-white/55">{me.email}</span>}
            </span>
          </div>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] ${RING}`}
          >
            <Home className="h-4 w-4" /> Public site
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className={`flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] ${RING}`}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sticky top-0 z-40 -mx-4 -mt-5 mb-5 flex items-center justify-between gap-2 border-b border-stone-dark/70 bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6 lg:hidden">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        <LogoMark className="h-7 w-7" />
        <span className="font-heading text-lg font-extrabold tracking-[-0.03em] text-ink">Vertexa QR</span>
      </Link>
      <div className="flex items-center gap-1.5">
        <Link
          href="/create"
          aria-label="Create QR code"
          className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-full bg-stone text-ink hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {mounted && open && createPortal(drawer, document.body)}
    </div>
  );
}
