"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Email gate shown after an anonymous QR is saved. Sends a Supabase
 * magic link (passwordless — no password friction here) whose redirect
 * lands on /auth/claim?draft_token=… to adopt the draft into the new
 * account. emailRedirectTo is built from window.location.origin so it
 * works on preview/prod/localhost without depending on
 * NEXT_PUBLIC_APP_URL (which is a placeholder on preview builds).
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
  const [email, setEmail] = useState("");
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
              className="mt-6 text-xs font-medium text-charcoal/55 transition-colors hover:text-deep-teal"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="font-display text-lg font-bold text-charcoal">
              Where should we send your QR code?
            </h2>
            <p className="mt-2 text-sm text-charcoal/60">
              We’ll email you a link to claim and activate it.
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
            <p className="mt-2 text-xs text-charcoal/50">
              Have an account? Same link works — we’ll log you in.
            </p>
            {err && <p className="mt-2 text-xs text-terracotta-dark">{err}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark disabled:opacity-60"
            >
              {loading ? "Sending…" : "Continue"}
            </button>
            <p className="mt-3 text-center text-xs text-charcoal/45">
              Free forever. No credit card.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
