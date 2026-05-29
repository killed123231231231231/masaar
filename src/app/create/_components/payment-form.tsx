"use client";

import { useState } from "react";
import { Wallet, Check } from "lucide-react";

// Payment is a placeholder — it captures interest into waitlist_signups
// and never creates a QR (backend: null, ready: false). Parity with
// getqr's payment tab, minus the legal exposure of processing payments.
export default function PaymentForm() {
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
    <div className="rounded-2xl border border-charcoal/10 bg-sand-light/40 p-8 text-center">
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-deep-teal/10 text-deep-teal">
        <Wallet className="h-7 w-7" strokeWidth={1.75} />
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-charcoal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-charcoal/55">
          Coming soon
        </span>
      </span>
      <h2 className="mt-5 font-display text-lg font-bold text-charcoal">
        Accept Mada, STC Pay &amp; Apple Pay via QR
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-charcoal/55">
        Payment QRs are in development. Leave your email and we’ll tell you
        the moment they launch.
      </p>

      {done ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-lg bg-deep-teal/10 px-4 py-2.5 text-sm font-semibold text-deep-teal">
          <Check className="h-4 w-4" /> We’ll let you know!
        </p>
      ) : (
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="block w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/15"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="shrink-0 rounded-lg bg-deep-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark disabled:opacity-60"
          >
            {submitting ? "…" : "Notify me"}
          </button>
        </div>
      )}
      {err && <p className="mt-3 text-xs font-medium text-terracotta-dark">{err}</p>}
    </div>
  );
}
