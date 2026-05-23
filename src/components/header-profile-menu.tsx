"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, LogOut, Settings } from "lucide-react";

/**
 * Avatar chip + dropdown for the public-site SiteHeader when the user
 * is logged in. Mirrors the dashboard sidebar's ProfileChip menu but
 * positioned for a top-anchored chip (popover drops DOWN, not UP) and
 * shows a "Dashboard" entry instead of "Back to public site" (we're
 * already on the public site).
 */
export default function HeaderProfileMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const initial = (email?.[0] ?? "U").toUpperCase();

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
        title={email ?? undefined}
        className="grid h-9 w-9 place-items-center rounded-full bg-deep-teal text-xs font-bold uppercase text-white transition-colors hover:bg-deep-teal-dark"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-charcoal/10 bg-white text-charcoal shadow-xl"
        >
          {email && (
            <div className="border-b border-charcoal/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-charcoal/45">
                Signed in as
              </p>
              <p className="truncate text-xs font-semibold text-charcoal">{email}</p>
            </div>
          )}
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
          >
            <LayoutGrid className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-sand-light hover:text-deep-teal"
          >
            <Settings className="h-4 w-4" /> Settings
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
