"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LoginModal from "@/components/login-modal";

/**
 * Email gate shown after an anonymous QR is saved. Sends a Supabase
 * magic link whose redirect lands on /auth/claim?draft_token=… to adopt
 * the draft. emailRedirectTo uses window.location.origin so it works on
 * preview/prod/localhost regardless of NEXT_PUBLIC_APP_URL. Returning
 * users can switch to the login view.
 */
export default function EmailGateModal({
  open,
  draftToken,
  onClose,
}: {
  open: boolean;
  draftToken: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<"email" | "login">("email");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/claim?draft_token=${encodeURIComponent(
      draftToken
    )}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-charcoal/40 px-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {view === "login" ? (
        <LoginModal
          draftToken={draftToken}
          onClose={onClose}
          onSwitchToSignup={() => setView("email")}
        />
      ) : (
        <div
          className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-7 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {sent ? (
            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-charcoal">
                Check your email
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
                We sent a magic link to <strong>{email}</strong>. Open it on
                this device to claim your QR code and finish setup.
              </p>
              <button
                onClick={onClose}
                className="mt-6 text-xs font-medium text-charcoal/55 hover:text-deep-teal"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-deep-teal/10 text-deep-teal">
                <QrCode className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-charcoal">
                Last Step!
              </h2>
              <p className="mt-1 text-sm text-charcoal/60">
                Tell us where to send your QR code.
              </p>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-5 w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
              />
              <label className="mt-3 flex items-start gap-2 text-xs text-charcoal/60">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-deep-teal hover:underline">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="font-medium text-deep-teal hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {err && <p className="mt-2 text-xs text-terracotta-dark">{err}</p>}
              <button
                type="submit"
                disabled={loading || !agreed}
                className="mt-4 w-full rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta disabled:opacity-50"
              >
                {loading ? "Sending…" : "Continue"}
              </button>
              <p className="mt-3 text-center text-xs text-charcoal/45">
                Free forever. No credit card.
              </p>
              <p className="mt-3 text-center text-xs text-charcoal/55">
                Have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="font-semibold text-deep-teal hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
