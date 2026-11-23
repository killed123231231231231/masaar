"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import LoginModal from "@/components/login-modal";
import LogoMark from "@/components/logo-mark";

interface NavItem {
  label: string;
  href: string;
}

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

/**
 * C2 — mobile menu for the public SiteHeader. Below `lg` the nav links
 * and (for anon) the Log in control are hidden in the header bar, so this
 * renders a hamburger + a full-width sheet with the nav links, the
 * Create-QR CTA, and a Log in entry (anon) that opens the same Welcome
 * Back modal the header uses. Authed account actions stay in the profile
 * menu.
 */
export default function MobileNav({
  nav,
  isAuthed,
}: {
  nav: NavItem[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Esc-to-close + body-scroll lock while any overlay is open.
  useEffect(() => {
    if (!open && !login) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setLogin(false);
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, login]);

  const itemCls = `flex items-center justify-between rounded-2xl px-4 py-3.5 font-heading text-[22px] font-medium tracking-[-0.01em] text-ink transition-colors hover:bg-stone ${ring}`;

  const drawer = (
    <div
      className="fixed inset-0 z-[90] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-x-0 top-0 flex max-h-[100dvh] flex-col rounded-b-[32px] bg-paper font-body shadow-float">
        <div className="flex h-[68px] items-center justify-between px-4 sm:h-[76px] sm:px-6">
          <span className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-heading text-[22px] font-extrabold tracking-[-0.03em] text-ink">
              Vertexa QR
            </span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className={`grid h-10 w-10 place-items-center rounded-full bg-stone text-ink transition-colors hover:bg-stone-dark ${ring}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 pb-2 sm:px-4">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={itemCls}
            >
              {item.label}
              <ChevronRight className="h-5 w-5 text-muted-4" aria-hidden />
            </Link>
          ))}
          {isAuthed && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className={itemCls}>
              Dashboard
              <ChevronRight className="h-5 w-5 text-muted-4" aria-hidden />
            </Link>
          )}
        </nav>

        <div className="grid gap-2 border-t border-stone px-4 pb-5 pt-4 sm:px-6">
          <Link
            href="/create"
            onClick={() => setOpen(false)}
            className={`flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-base font-medium text-white transition-colors hover:bg-ink-soft ${ring}`}
          >
            Create QR code
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
          {!isAuthed && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setLogin(true);
              }}
              className={`flex h-12 items-center justify-center rounded-full bg-stone px-5 text-base font-medium text-ink transition-colors hover:bg-stone-dark ${ring}`}
            >
              Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const loginOverlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log in"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm"
      onClick={() => setLogin(false)}
    >
      <LoginModal
        onClose={() => setLogin(false)}
        onSwitchToSignup={() => {
          setLogin(false);
          router.push("/create");
        }}
      />
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className={`grid h-10 w-10 place-items-center rounded-full bg-stone text-ink transition-colors hover:bg-stone-dark lg:hidden ${ring}`}
      >
        <Menu className="h-5 w-5" />
      </button>
      {mounted && open && createPortal(drawer, document.body)}
      {mounted && login && createPortal(loginOverlay, document.body)}
    </>
  );
}
