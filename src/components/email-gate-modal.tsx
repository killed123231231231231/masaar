"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode } from "lucide-react";
import LoginModal from "@/components/login-modal";
import TurnstileWidget, { turnstileEnabled } from "@/components/turnstile-widget";
import { createClient } from "@/lib/supabase/client";
import { authEmailOrigin } from "@/lib/auth-origin";

/**
 * Email gate for the anonymous builder. NEW users: hold the email on the
 * draft row, then send a Supabase magic link that lands on /auth/claim,
 * which signs them in and adopts the draft QR. The account is only created
 * once they open the link, so nobody can create an account (or receive our
 * email) for an address they don't own. Returning users: "Log in".
 */
export default function EmailGateModal({
  open,
  draftToken,
  onClose,
}: {
  open: boolean;
  draftToken: string;
  /** Kept for callers; the magic link carries the draft token instead. */
  shortId?: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<"email" | "login">("email");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (turnstileEnabled && !captcha) {
      setErr("Please complete the verification below.");
      return;
    }
    setLoading(true);
    setErr(null);
    const em = email.trim().toLowerCase();

    // Hold the email on the draft row. Surface real errors and stop on
    // failure; never invent a message, show what the server said.
    let res: Response;
    try {
      res = await fetch("/api/qr/anonymous/email", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft_token: draftToken, email: em }),
      });
    } catch {
      setLoading(false);
      setErr("Couldn’t save your email. Please retry.");
      return;
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      setLoading(false);
      setErr(
        body?.message ||
          body?.error ||
          "Couldn’t save your email. Please retry."
      );
      return;
    }

    // Magic link → /auth/claim signs them in and adopts this draft.
    const supabase = createClient();
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: em,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${authEmailOrigin()}/auth/claim?draft_token=${encodeURIComponent(draftToken)}`,
        ...(captcha ? { captchaToken: captcha } : {}),
      },
    });
    setCaptchaReset((n) => n + 1);
    setLoading(false);
    if (otpErr) {
      setErr(otpErr.message || "Couldn’t send the sign-in link. Please retry.");
      return;
    }
    setSentTo(em);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm"
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
          className="w-full max-w-sm rounded-panel border border-stone-dark bg-white p-7 font-body shadow-float"
          onClick={(e) => e.stopPropagation()}
        >
          {sentTo ? (
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-lime text-ink">
                <QrCode className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-heading text-2xl font-medium text-ink">
                Check your email
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-2">
                We sent a sign-in link to <strong className="text-ink">{sentTo}</strong>. Open it on
                this device and your QR code will be saved to your new account.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 text-xs font-medium text-muted-3 hover:text-ink"
              >
                Close
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-lime text-ink">
              <QrCode className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-heading text-2xl font-medium text-ink">
              Last Step!
            </h2>
            <p className="mt-1 text-sm text-muted-2">
              Tell us where to send your QR code.
            </p>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email"
              className="mt-5 w-full rounded-xl h-11 border border-stone-dark bg-white px-3.5 py-2.5 text-ink placeholder:text-muted-3 hover:border-ink/25 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
            />
            <label className="mt-3 flex items-start gap-2 text-xs text-muted-2">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-ink"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="font-medium text-ink underline underline-offset-2 hover:no-underline">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="font-medium text-ink underline underline-offset-2 hover:no-underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            <div className="mt-3">
              <TurnstileWidget onToken={setCaptcha} resetKey={captchaReset} />
            </div>
            {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="mt-4 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-50"
            >
              {loading ? "Sending link…" : "Email me a sign-in link"}
            </button>
            <p className="mt-3 text-center text-xs text-muted-3">
              Free plan. No card needed.
            </p>
            <p className="mt-3 text-center text-xs text-muted-3">
              Have an account?{" "}
              <button
                type="button"
                onClick={() => setView("login")}
                className="font-semibold text-ink underline underline-offset-2 hover:no-underline"
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
