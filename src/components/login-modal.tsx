"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Returning-user login. Two entry points:
 *   1. From the email gate ("Have an account?") — passes the in-progress
 *      `draftToken` so the magic-link claim flow adopts the draft.
 *   2. From the landing header ("Log in") — no draft in flight, so
 *      `draftToken` is omitted. The magic link still goes through
 *      `/auth/claim` which falls through to `/dashboard?welcome=1` when
 *      no `draft_token` query param is present.
 * Google OAuth is stubbed — wiring it needs Supabase + Google Cloud
 * config (separate task, deferred).
 */
export default function LoginModal({
  draftToken,
  onClose,
  onSwitchToSignup,
}: {
  draftToken?: string;
  onClose: () => void;
  onSwitchToSignup: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Diagnostic: confirms the legitimate Log-in (magic-link) path
    // ran. If you see this on the "new-user" smoke, you clicked
    // "Have an account? Log in" and Supabase's OTP rate limit applies.
    console.info("[auth] login submit → signInWithOtp (magic link)");
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const redirectTo = draftToken
      ? `${window.location.origin}/auth/claim?draft_token=${encodeURIComponent(draftToken)}`
      : `${window.location.origin}/auth/claim`;
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
      className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-7 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {sent ? (
        <div className="text-center">
          <h2 className="font-display text-lg font-bold text-charcoal">
            Check your email
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
            We sent a sign-in link to <strong>{email}</strong>. Open it on
            this device to continue.
          </p>
          <button
            onClick={onClose}
            className="mt-6 text-xs font-medium text-charcoal/55 hover:text-deep-teal"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <h2 className="font-display text-lg font-bold text-charcoal">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Please enter your details to sign in
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-5 w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
            />
            {err && <p className="mt-2 text-xs text-terracotta-dark">{err}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta disabled:opacity-60"
            >
              {loading ? "Sending…" : "Continue"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-charcoal/40">
            <span className="h-px flex-1 bg-charcoal/10" /> OR
            <span className="h-px flex-1 bg-charcoal/10" />
          </div>
          <button
            type="button"
            onClick={() => toast("Google sign-in is coming soon")}
            className="w-full rounded-lg border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-sand-light/60"
          >
            Continue with Google
          </button>

          <p className="mt-5 text-center text-xs text-charcoal/55">
            No account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-semibold text-deep-teal hover:underline"
            >
              Create your first QR
            </button>
          </p>
        </>
      )}
    </div>
  );
}
