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
        aria-label={email ? `Account menu for ${email}` : "Account menu"}
        className="grid h-10 w-10 place-items-center rounded-full bg-ink font-heading text-sm font-bold uppercase text-lime transition-transform duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-stone-dark bg-white p-1.5 font-body text-ink shadow-float"
        >
          {email && (
            <div className="mb-1 rounded-xl bg-cream px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-3">
                Signed in as
              </p>
              <p className="truncate text-sm font-medium text-ink">{email}</p>
            </div>
          )}
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-stone focus-visible:bg-stone focus-visible:outline-none"
          >
            <LayoutGrid className="h-4 w-4 text-muted-3" /> Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-stone focus-visible:bg-stone focus-visible:outline-none"
          >
            <Settings className="h-4 w-4 text-muted-3" /> Settings
          </Link>
          <form
            action="/auth/signout"
            method="post"
            className="mt-1 border-t border-stone pt-1"
          >
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-stone focus-visible:bg-stone focus-visible:outline-none"
            >
              <LogOut className="h-4 w-4 text-muted-3" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
