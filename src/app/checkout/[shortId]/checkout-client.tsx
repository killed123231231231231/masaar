"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QrPreview from "@/components/qr-preview";
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
}

// STRATEGY.md §5 pricing thesis (SAR/mo). The stub activates regardless
// of selected plan — billing is Sprint 3.
const PLANS = [
  { id: "starter", name: "Starter", price: 49, blurb: "Up to 5 dynamic QRs, basic analytics" },
  { id: "pro", name: "Pro", price: 99, blurb: "Unlimited QRs, full analytics, logo embed, custom design" },
  { id: "menu_pro", name: "Menu Pro", price: 199, blurb: "All Pro + menu builder, bilingual, photos, allergens" },
] as const;

export default function CheckoutClient({
  qr,
  paymentsEnabled,
  anon,
}: {
  qr: CheckoutQr;
  paymentsEnabled: boolean;
  anon?: { draftToken: string; email: string } | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<string>("pro");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loginHint, setLoginHint] = useState<string | null>(null);

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
    }),
    [qr]
  );

  async function handlePay() {
    setBusy(true);
    setErr(null);
    setLoginHint(null);

    if (anon) {
      // Email-holding path: creates the account + activates + emails.
      const res = await fetch("/api/checkout/anon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draft_token: anon.draftToken,
          email: anon.email,
          plan,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        // Anon → public /checkout/success (no session yet; /dashboard is
        // middleware-gated and would bounce to /login). The welcome
        // email carries the magic-link login. Post-checkout auto-login
        // is BACKLOGed.
        router.push(
          data.redirect_url ||
            `/checkout/success?email=${encodeURIComponent(anon.email)}`
        );
        return;
      }
      setBusy(false);
      if (res.status === 409) {
        setErr(
          data?.message ||
            "This email already has an account. Please log in instead."
        );
        setLoginHint("/login");
        return;
      }
      setErr(data?.message || data?.error || "Could not complete checkout.");
      return;
    }

    const res = await fetch("/api/checkout/activate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ short_id: qr.short_id, plan }),
    });
    if (res.ok) {
      router.push("/dashboard?welcome=1");
      return;
    }
    setBusy(false);
    const { error } = await res.json().catch(() => ({ error: "Failed" }));
    setErr(error || "Could not activate. Try again.");
  }

  return (
    <main className="min-h-screen bg-sand-light/40 px-5 py-10">
      <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal">
            Activate “{qr.name}”
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Pick a plan to make this QR live. Cancel anytime.
          </p>

          <div className="mt-6 space-y-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  plan === p.id
                    ? "border-deep-teal bg-deep-teal/5"
                    : "border-charcoal/15 bg-white hover:border-deep-teal/40"
                }`}
              >
                <span>
                  <span className="font-display font-bold text-charcoal">
                    {p.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-charcoal/55">
                    {p.blurb}
                  </span>
                </span>
                <span className="shrink-0 font-display font-bold text-charcoal">
                  SAR {p.price}
                  <span className="text-xs font-normal text-charcoal/50">
                    /mo
                  </span>
                </span>
              </button>
            ))}
          </div>

          {err && (
            <p className="mt-4 text-sm text-terracotta-dark">
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

          <button
            onClick={handlePay}
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark disabled:opacity-60"
          >
            {busy
              ? "Activating…"
              : paymentsEnabled
                ? "Continue to payment"
                : "Activate now"}
          </button>
          <p className="mt-3 text-center text-xs text-charcoal/45">
            7-day trial for SAR 5 · cancel anytime
          </p>
        </div>

        <div className="lg:pt-14">
          <QrPreview style={style} />
        </div>
      </div>
    </main>
  );
}
