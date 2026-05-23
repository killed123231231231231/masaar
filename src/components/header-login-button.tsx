"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/login-modal";

/**
 * "Log in" trigger for the public-site header. Opens the same Welcome
 * Back modal the email gate uses (no draft_token in flight from the
 * landing). "No account? Create your first QR" closes the modal and
 * routes to /create. Backdrop click + Escape both dismiss.
 *
 * B5/Bug 15 — the SiteHeader uses `backdrop-blur` which creates a CSS
 * containing block for `fixed` descendants; without a portal, the
 * overlay was constrained to the header bar (upper-left). Render the
 * overlay via createPortal so `fixed inset-0` anchors to the viewport.
 */
export default function HeaderLoginButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // createPortal needs document — guard SSR.
  useEffect(() => setMounted(true), []);

  // Esc-to-close + body-scroll lock while open.
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

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log in"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-4 py-6 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <LoginModal
        onClose={() => setOpen(false)}
        onSwitchToSignup={() => {
          setOpen(false);
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
        className="hidden px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-deep-teal sm:inline-block"
      >
        Log in
      </button>

      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}
