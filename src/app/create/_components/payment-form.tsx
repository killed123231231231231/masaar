"use client";

import { useState } from "react";
import { ArrowLeft, Wallet, Check } from "lucide-react";

// Payment is a placeholder — it captures interest into waitlist_signups
// and never creates a QR (backend: null, ready: false). Parity with
// getqr's payment tab, minus the legal exposure of processing payments.
export default function PaymentForm({
  onBackToTypes,
}: {
  /** Returns the wizard to Step 1 — this form has no Next action, so the
   *  success state needs its own way forward (was a dead-end). */
  onBackToTypes?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const e = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setErr("Enter a valid email.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e, source: "payment_qr" }),
      });
      if (!res.ok) {
        setErr("Couldn’t sign up just now. Try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("Couldn’t sign up just now. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-stone/60 p-8 text-center">
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lime/40 text-ink">
        <Wallet className="h-7 w-7" strokeWidth={1.75} />
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-2">
          Coming soon
        </span>
      </span>
      <h2 className="mt-5 font-heading text-lg font-bold text-ink">
        Accept Mada, STC Pay &amp; Apple Pay via QR
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-3">
        Payment QRs are in development. Leave your email and we’ll tell you
        the moment they launch.
      </p>

      {done ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-xl bg-lime/40 px-4 py-2.5 text-sm font-semibold text-ink">
            <Check className="h-4 w-4" /> We’ll let you know!
          </p>
          {onBackToTypes && (
            <button
              type="button"
              onClick={onBackToTypes}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Choose another QR type
            </button>
          )}
        </div>
      ) : (
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="block min-h-[44px] w-full rounded-xl border border-stone-dark bg-white px-4 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-muted-3 hover:border-ink/25 focus:border-ink focus:ring-2 focus:ring-ink/20"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
          >
            {submitting ? "…" : "Notify me"}
          </button>
        </div>
      )}
      {err && <p className="mt-3 text-xs font-medium text-red-700">{err}</p>}
    </div>
  );
}
