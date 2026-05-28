"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
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
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // createPortal needs document — guard SSR.
  useEffect(() => setMounted(true), []);

  // B5/Round2 H4 — autohook for the email→landing→login flow. When the
  // welcome-email's "Manage your QR" button bounces an unauthed user
  // to /?redirectTo=%2Fdashboard via middleware (or /api/checkout/anon
  // 409 sends ?login=1&email=), we want them to land WITH the login
  // modal already open instead of hunting for the "Log in" button.
  // Triggers on either ?login=1 OR ?redirectTo=... .
  useEffect(() => {
    const wantsLogin =
      params.get("login") === "1" || params.has("redirectTo");
    if (wantsLogin) setOpen(true);
    // intentionally one-shot — don't re-open if user closes + reload
    // with the same query; they made an explicit dismissal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        initialEmail={params.get("email") ?? undefined}
        redirectTo={params.get("redirectTo") ?? undefined}
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
