"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import LoginModal from "@/components/login-modal";

/**
 * Email-holding gate (A.7). NEW users: capture email → hold it on the
 * draft row → straight to /checkout (NO magic link). Returning users:
 * "Have an account? Log in" → LoginModal which DOES send a magic link
 * (that path is unchanged).
 */
export default function EmailGateModal({
  open,
  draftToken,
  shortId,
  onClose,
}: {
  open: boolean;
  draftToken: string;
  shortId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<"email" | "login">("email");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Diagnostic: confirms in devtools that the NEW-USER path ran, NOT
    // signInWithOtp. If you see "[auth] new-user submit" you are on
    // the email-holding path (no magic link). If instead you see
    // "[auth] login submit" your click hit the Log-in modal.
    console.info("[auth] new-user submit → /checkout (no magic link)");
    setLoading(true);
    setErr(null);
    const em = email.trim().toLowerCase();

    try {
      localStorage.setItem(
        "masaar.checkout_pending",
        JSON.stringify({ email: em, draft_token: draftToken, short_id: shortId })
      );
    } catch {
      /* private mode — query params still carry the data */
    }

    // Hold the email on the draft row so the checkout page can verify
    // it. Surface real errors and DON'T navigate on failure — a silent
    // pass-through to /checkout would dead-end the user. Never invent
    // a message (e.g. "rate limit exceeded"); show what the server
    // actually said, or a clean generic if the body is opaque.
    let res: Response;
    try {
      res = await fetch("/api/qr/anonymous/email", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft_token: draftToken, email: em }),
      });
    } catch {
      setLoading(false);
      setErr("Couldn’t save your email — please retry.");
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
          "Couldn’t save your email — please retry."
      );
      return;
    }

    setLoading(false);
    const seg = shortId || "draft";
    router.push(
      `/checkout/${seg}?draft_token=${encodeURIComponent(
        draftToken
      )}&email=${encodeURIComponent(em)}`
    );
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
              {loading ? "Continuing…" : "Continue"}
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
        </div>
      )}
    </div>
  );
}
