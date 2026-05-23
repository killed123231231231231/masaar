"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Returning-user login. Two entry points:
 *   1. From the email gate ("Have an account?") — passes the in-progress
 *      `draftToken`; on successful login the draft is claimed via the
 *      claim_draft_qrs RPC and the user is sent to /checkout/<shortId>.
 *   2. From the landing header ("Log in") — no draft in flight, login
 *      success routes to /dashboard.
 *
 * B5/Bug 16 — primary auth is now email + password via
 * `signInWithPassword`. The previous magic-link-only flow had two
 * problems: (a) every login required an email round-trip, and (b)
 * frictionless-checkout accounts (Session A.7) had no password set,
 * so they could only re-enter via magic link. New UX:
 *   - Inline password field with show/hide toggle.
 *   - On any login failure, surface the error AND a "Get a setup link"
 *     button that fires `resetPasswordForEmail` — which doubles as the
 *     first-time-password-set flow for A.7 accounts.
 *   - "Forgot password?" link does the same setup-link send.
 * Google OAuth is still stubbed.
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setErr("Email and password are required.");
      return;
    }
    setLoading(true);
    setErr(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);
      // Supabase returns the same opaque "Invalid login credentials" for
      // wrong-password AND for no-password-set accounts (A.7 frictionless
      // checkout) — it intentionally doesn't reveal whether the email
      // exists. The setup-link button below covers both cases.
      setErr(error.message);
      return;
    }

    // Logged in. If we came from the email gate with a draft in flight,
    // claim it now (server RPC, owner-RLS scoped) and route to the
    // resulting checkout. Otherwise straight to dashboard.
    if (draftToken) {
      const { data, error: rpcErr } = await supabase.rpc("claim_draft_qrs", {
        p_draft_token: draftToken,
      });
      const shortId = Array.isArray(data) ? data[0]?.short_id : undefined;
      if (!rpcErr && shortId) {
        onClose();
        router.push(`/checkout/${shortId}`);
        router.refresh();
        return;
      }
    }
    onClose();
    router.push("/dashboard?welcome=1");
    router.refresh();
  }

  async function handleSendSetupLink() {
    const em = email.trim().toLowerCase();
    if (!em) {
      setErr("Enter your email above first.");
      return;
    }
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <div
      className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-7 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {resetSent ? (
        <div className="text-center">
          <h2 className="font-display text-lg font-bold text-charcoal">
            Check your email
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
            We sent a setup link to <strong>{email}</strong>. Open it on
            this device to set your password.
          </p>
          <button
            type="button"
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

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 pr-10 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 grid place-items-center px-2 text-charcoal/50 hover:text-charcoal/75"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {err && (
              <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-2.5">
                <p className="text-xs text-terracotta-dark">{err}</p>
                <p className="mt-1.5 text-[11px] text-charcoal/65">
                  First time logging in (or forgot)?{" "}
                  <button
                    type="button"
                    onClick={handleSendSetupLink}
                    disabled={loading}
                    className="font-semibold text-deep-teal hover:underline disabled:opacity-60"
                  >
                    Send me a setup link
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Log in"}
            </button>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSendSetupLink}
                disabled={loading}
                className="text-xs font-medium text-charcoal/55 hover:text-deep-teal disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>
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
            . Get started{" "}
            <Link
              href="/create"
              onClick={onClose}
              className="font-semibold text-deep-teal hover:underline"
            >
              here
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
