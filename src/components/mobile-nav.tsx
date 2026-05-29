"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import LoginModal from "@/components/login-modal";

interface NavItem {
  label: string;
  href: string;
}

/**
 * C2 — mobile menu for the public SiteHeader. Below `md` the nav anchors
 * and (for anon) the Log in control were hidden with no fallback, so
 * mobile visitors couldn't navigate or sign in. This renders a hamburger
 * (md:hidden) + a slide-in drawer with the nav links, the Create-QR CTA,
 * and a Log in entry (anon) that opens the same Welcome Back modal the
 * header uses. Authed account actions stay in the profile menu.
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

  const itemCls =
    "block rounded-lg px-3 py-3 text-sm font-medium text-charcoal/80 transition-colors hover:bg-sand-light hover:text-deep-teal";

  const drawer = (
    <div
      className="fixed inset-0 z-[90] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
          <span className="font-display font-bold text-charcoal">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-charcoal/55 hover:bg-sand-light hover:text-charcoal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={itemCls}
            >
              {item.label}
            </Link>
          ))}
          {!isAuthed && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setLogin(true);
              }}
              className={`${itemCls} w-full text-left`}
            >
              Log in
            </button>
          )}
          {isAuthed && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className={itemCls}>
              Dashboard
            </Link>
          )}
        </nav>

        <div className="border-t border-charcoal/10 p-4">
          <Link
            href="/create"
            onClick={() => setOpen(false)}
            className="block rounded-lg bg-deep-teal px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark"
          >
            Create QR Code
          </Link>
        </div>
      </div>
    </div>
  );

  const loginOverlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log in"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-4 py-6 backdrop-blur-sm"
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
        className="grid h-10 w-10 place-items-center rounded-lg text-charcoal/70 transition-colors hover:bg-sand-light md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>
      {mounted && open && createPortal(drawer, document.body)}
      {mounted && login && createPortal(loginOverlay, document.body)}
    </>
  );
}
