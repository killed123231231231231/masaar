"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Timer } from "lucide-react";
import QrPreview from "@/components/qr-preview";
import LogoMark from "@/components/logo-mark";
import type { QrStyle } from "@/lib/qr";

interface CheckoutQr {
  id: string;
  short_id: string | null;
  name: string;
  status: string;
  kind: string;
  destination: string;
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
  // B5/Round2 Item 6 — pass through to QrPreview so the checkout-page
  // QR shows the user's logo BEFORE they pay.
  logo_url: string | null;
}

// SAR pricing — only shown when PAYMENTS_ENABLED is on. While it is off,
// activation is free and the page says so plainly (no strike-through
// "regular" price, no promo code, no urgency timer).
const PRICE_NOW = 5;        // SAR — what the user pays today once billing is live
const RECURRING = 99;       // SAR/mo — what we'll bill after trial
const TRIAL_DAYS = 7;

// Real countdown — 5 minutes per page load, no fake persistence.
const COUNTDOWN_SECONDS = 5 * 60;

const FEATURES = [
  "Download as PNG, JPG, and SVG",
  "Edit destination anytime — no reprints",
  "Unlimited dynamic QR codes",
  "Full scan analytics (geo + device + trend)",
  "Logo, color, and frame customization",
];

type PaymentMethod = "card" | "paypal" | "gpay";

export default function CheckoutClient({
  qr,
  paymentsEnabled,
  anon,
  socialProofCount,
}: {
  qr: CheckoutQr;
  paymentsEnabled: boolean;
  anon?: { draftToken: string; email: string } | null;
  socialProofCount: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<PaymentMethod | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loginHint, setLoginHint] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  // Tick the countdown. Resets to 5:00 on refresh (and that's fine — the
  // pattern is conversion-optimization not fraud).
  useEffect(() => {
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(id);
  }, []);

  const expired = secondsLeft === 0;

  const style: QrStyle = useMemo(
    () => ({
      data:
        qr.kind === "dynamic" && qr.short_id
          ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${qr.short_id}`
          : qr.destination || " ",
      fgColor: qr.fg_color,
      bgColor: qr.bg_color,
      gradientColor: qr.gradient_color,
      dotStyle: qr.dot_style,
      cornerStyle: qr.corner_style,
      // B5/Round2 Item 6 — wire the logo through so QrPreview's
      // qr-code-styling render composites it. Without this, the user
      // sees a logo-less QR on the checkout page and only discovers
      // their logo style after paying.
      logoUrl: qr.logo_url,
    }),
    [qr]
  );

  async function handlePay(method: PaymentMethod) {
    setBusy(method);
    setErr(null);
    setLoginHint(null);

    // TODO(Sprint 3): when PAYMENTS_ENABLED=true, route by method to the
    // appropriate gateway (Tap/HyperPay/Mada for card, PayPal SDK for PayPal,
    // Google Pay for GPay). Today all three pass through the same activate
    // endpoint and just flip status — the buttons exist to validate the UX
    // before billing wires up.
    if (anon) {
      const res = await fetch("/api/checkout/anon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draft_token: anon.draftToken,
          email: anon.email,
          plan: "pro",
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        // Post-B5 contamination fix (2026-05-24): clear the wizard's
        // localStorage keys BEFORE navigating so the next anon flow on
        // this browser starts with a fresh draft_token. Pre-fix the
        // stale token persisted and re-attached week-old orphan rows
        // to subsequent signups. Belt-and-suspenders alongside the
        // wizard's own 1-hour TTL rotation on mount.
        try {
          localStorage.removeItem("masaar.wizard_state");
          localStorage.removeItem("masaar.checkout_pending");
        } catch {
          /* private mode / quota — non-fatal */
        }
        router.push(
          data.redirect_url ||
            `/checkout/success?email=${encodeURIComponent(anon.email)}`
        );
        return;
      }
      setBusy(null);
      if (res.status === 409) {
        setErr(
          data?.message ||
            "This email already has an account. Please log in instead."
        );
        // B7/P1-4 — open the landing's Welcome Back modal directly (no
        // standalone /login page) with the email prefilled and a return
        // path back to this checkout so they finish activating after
        // signing in.
        setLoginHint(
          `/?login=1&email=${encodeURIComponent(anon.email)}&redirectTo=/checkout/${qr.short_id}`
        );
        return;
      }
      setErr(data?.message || data?.error || "Could not complete checkout.");
      return;
    }

    const res = await fetch("/api/checkout/activate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ short_id: qr.short_id, plan: "pro" }),
    });
    if (res.ok) {
      router.push("/dashboard?welcome=1");
      return;
    }
    setBusy(null);
    const { error } = await res.json().catch(() => ({ error: "Failed" }));
    setErr(error || "Could not activate. Try again.");
  }

  return (
    <main className="min-h-screen bg-paper font-body text-ink">
      {paymentsEnabled ? (
        <CountdownBanner secondsLeft={secondsLeft} expired={expired} />
      ) : (
        <div className="bg-ink px-5 py-2.5 text-center text-xs font-semibold text-white sm:text-sm">
          Free during launch. No card needed.
        </div>
      )}
      <TopBar />

      <div className="mx-auto max-w-6xl px-5 pb-28 pt-8 lg:pb-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <LeftColumn qr={qr} style={style} socialProofCount={socialProofCount} />
          <RightColumn
            qr={qr}
            busy={busy}
            err={err}
            loginHint={loginHint}
            paymentsEnabled={paymentsEnabled}
            onPay={handlePay}
            expired={expired}
          />
        </div>
      </div>

      <MobilePayBar
        busy={busy}
        onPay={() => handlePay("card")}
        paymentsEnabled={paymentsEnabled}
      />
    </main>
  );
}

/* ─────────────────────────── COUNTDOWN ─────────────────────────── */

function CountdownBanner({
  secondsLeft,
  expired,
}: {
  secondsLeft: number;
  expired: boolean;
}) {
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  return (
    <div
      className={`px-5 py-2.5 text-center text-xs font-semibold text-white sm:text-sm ${
        expired ? "bg-muted" : "bg-ink"
      }`}
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Timer className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {expired ? (
          <span>Special offer expired — you can still activate at the regular rate.</span>
        ) : (
          <>
            <span>
              Activate now for{" "}
              <span className="font-bold">SAR {PRICE_NOW}</span> · offer ends in
            </span>
            <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono tabular-nums">
              {mm}:{ss.toString().padStart(2, "0")}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

/* ─────────────────────────── TOP BAR ─────────────────────────── */

function TopBar() {
  return (
    <header className="border-b border-ink/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-heading text-lg font-extrabold tracking-[-0.03em] text-ink">
            Vertexa QR
          </span>
        </Link>
        <span className="text-[11px] uppercase tracking-wider text-muted-3">
          Secure checkout
        </span>
      </div>
    </header>
  );
}

/* ─────────────────────────── LEFT COLUMN ─────────────────────────── */

function LeftColumn({
  qr,
  style,
  socialProofCount,
}: {
  qr: CheckoutQr;
  style: QrStyle;
  socialProofCount: number | null;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-card border border-stone-dark bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-heading text-[28px] font-medium tracking-[-0.02em] tracking-tight sm:text-3xl">
          Your QR code is ready!
        </h1>
        <p className="mt-1 text-sm text-muted-2">
          Activating <span className="font-medium text-muted">“{qr.name}”</span>
          {qr.short_id && (
            <>
              {" "}· <code className="text-xs">/r/{qr.short_id}</code>
            </>
          )}
        </p>

        <div className="mt-6 flex justify-center">
          <QrPreview style={style} />
        </div>
      </div>

      <SocialProofCard count={socialProofCount} />
    </section>
  );
}

function SocialProofCard({ count }: { count: number | null }) {
  // Real number when meaningful, honest fallback otherwise.
  const showRealNumber = count != null && count >= 100;
  return (
    <div className="rounded-card border border-stone-dark bg-white p-6 shadow-card">
      <p className="font-heading text-base font-bold text-ink">
        {showRealNumber ? (
          <>{formatCount(count!)} QR codes created in the last 24 hours</>
        ) : (
          <>Early access</>
        )}
      </p>
      <p className="mt-1 text-xs text-muted-2">
        {showRealNumber
          ? "Counted live from Vertexa QR."
          : "Vertexa QR has just launched. Your feedback shapes what we build next."}
      </p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`;
  }
  return n.toLocaleString();
}

/* ─────────────────────────── RIGHT COLUMN ─────────────────────────── */

function RightColumn({
  qr,
  busy,
  err,
  loginHint,
  paymentsEnabled,
  onPay,
  expired,
}: {
  qr: CheckoutQr;
  busy: PaymentMethod | null;
  err: string | null;
  loginHint: string | null;
  paymentsEnabled: boolean;
  onPay: (m: PaymentMethod) => void;
  expired: boolean;
}) {
  return (
    <section className="rounded-card border border-stone-dark bg-white p-6 shadow-card sm:p-8">
      <h2 className="font-heading text-[28px] font-medium tracking-[-0.02em] tracking-tight sm:text-3xl">
        Activate now
      </h2>
      <p className="mt-1 text-sm text-muted-2">
        Make “{qr.name}” live in seconds.
      </p>

      <ul className="mt-6 space-y-2.5">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={2.5} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-end justify-between gap-4 border-y border-ink/10 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-3">
            Total due today
          </p>
          <p className="mt-1 font-heading text-3xl font-bold text-ink">
            {paymentsEnabled ? `SAR ${PRICE_NOW.toFixed(2)}` : "Free"}
          </p>
          {!paymentsEnabled && (
            <p className="text-xs text-muted-3">Free during launch</p>
          )}
        </div>
        {paymentsEnabled && (
          <p className="max-w-[140px] text-right text-[10px] text-muted-3">
            {TRIAL_DAYS}-day trial, then SAR {RECURRING}/mo. Cancel anytime.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        <PayPalButton onClick={() => onPay("paypal")} busy={busy === "paypal"} disabled={busy != null} />
        <GPayButton onClick={() => onPay("gpay")} busy={busy === "gpay"} disabled={busy != null} />
        <CardButton onClick={() => onPay("card")} busy={busy === "card"} disabled={busy != null} />
      </div>

      {paymentsEnabled && (
        <p className="mt-3 text-center text-[11px] text-red-700">
          Payments are in test mode — your card will not be charged.
        </p>
      )}

      {!paymentsEnabled && (
        <p className="mt-3 text-center text-[11px] text-muted-3">
          Activation is free during launch. You will not be charged.
        </p>
      )}

      {paymentsEnabled && expired && (
        <p className="mt-3 text-center text-[11px] text-muted-3">
          The countdown expired — you can still activate at the trial rate above.
        </p>
      )}

      {err && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
          {loginHint && (
            <>
              {" "}
              <a href={loginHint} className="font-semibold underline">
                Log in
              </a>
            </>
          )}
        </p>
      )}

      <p className="mt-5 text-center text-[10px] leading-relaxed text-muted-3">
        By activating you agree to our{" "}
        <Link href="/terms" className="underline hover:text-muted">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-muted">Privacy Policy</Link>.
        {paymentsEnabled && (
          <>
            {" "}Get a {TRIAL_DAYS}-day trial for SAR {PRICE_NOW}. After trial,
            we&apos;ll charge SAR {RECURRING} every month until you cancel.
          </>
        )}
      </p>
    </section>
  );
}

/* ─────────────────────────── PAYMENT BUTTONS ─────────────────────────── */

function PayPalButton({
  onClick, busy, disabled,
}: { onClick: () => void; busy: boolean; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC439] py-3 text-sm font-bold text-[#003087] shadow-sm transition-colors hover:bg-[#F0B72F] disabled:opacity-60"
    >
      {busy ? "Processing…" : (
        <>
          <span className="text-[#003087]">Pay</span>
          <span className="text-[#009CDE]">Pal</span>
        </>
      )}
    </button>
  );
}

function GPayButton({
  onClick, busy, disabled,
}: { onClick: () => void; busy: boolean; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink/90 disabled:opacity-60"
    >
      {busy ? "Processing…" : (
        <>
          <GPayMark />
          <span>Pay</span>
        </>
      )}
    </button>
  );
}

function GPayMark() {
  // Stylized "G" — not the real Google logo (which we can't ship without
  // brand permission). Brand-safe placeholder until Sprint 3 wires real GPay.
  return (
    <span
      className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-extrabold text-ink"
      aria-hidden
    >
      G
    </span>
  );
}

function CardButton({
  onClick, busy, disabled,
}: { onClick: () => void; busy: boolean; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
    >
      {busy ? "Activating…" : (
        <>
          <CreditCard className="h-4 w-4" strokeWidth={2.25} />
          Pay with credit / debit card
        </>
      )}
    </button>
  );
}

/* ─────────────────────────── MOBILE STICKY BAR ─────────────────────────── */

function MobilePayBar({
  busy,
  onPay,
  paymentsEnabled,
}: {
  busy: PaymentMethod | null;
  onPay: () => void;
  paymentsEnabled: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-3">
            Today
          </p>
          <p className="font-heading text-base font-bold text-ink">
            {paymentsEnabled ? `SAR ${PRICE_NOW.toFixed(2)}` : "Free"}
          </p>
        </div>
        <button
          type="button"
          onClick={onPay}
          disabled={busy != null}
          className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {busy ? "Processing…" : paymentsEnabled ? "Continue to payment" : "Activate now"}
        </button>
      </div>
    </div>
  );
}
