"use client";

import Link from "next/link";
import { Check, ChevronDown, Minus } from "lucide-react";

// Vertexa QR is a free product (PAYMENTS_ENABLED stays false), so the
// page lists one plan. The paid tiers, cadence toggle and comparison
// matrix were removed; checkout code is untouched and stays switched off.
const FREE_PLAN = {
  name: "Free",
  price: "SAR 0",
  blurb: "Everything in Vertexa QR. No card needed.",
  cta: "Create a QR code",
  href: "/create",
  included: [
    "Up to 25 QR codes per account",
    "Dynamic QR codes: change the destination any time",
    "Scan analytics for every code",
    "PDF uploads up to 5 MB",
    "Image uploads up to 2 MB",
  ],
  excluded: ["Video uploads (link to YouTube or Vimeo instead)"],
};

const PRICING_FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. There are no paid plans and no card is needed to sign up or create QR codes.",
  },
  {
    q: "What happens when I reach 25 QR codes?",
    a: "You can't create more until you delete one you no longer need. Codes you already printed keep working.",
  },
  {
    q: "Can I add a video?",
    a: "Video uploads aren't supported. Upload the video to YouTube or Vimeo and create a link QR code that points to it.",
  },
  {
    q: "What counts as a scan?",
    a: "Any successful hit to /r/<your-qr> that resolves to your destination. Bot traffic (Slackbot, WhatsApp link previews, headless browsers) is filtered out before it shows up in your dashboard.",
  },
];

export default function PricingClient() {
  return (
    <>
      <PlanCard />
      <PricingFaqs />
    </>
  );
}

function PlanCard() {
  return (
    <div className="max-w-xl rounded-2xl border border-deep-teal/30 bg-white p-6 shadow-[0_8px_32px_-12px_rgba(15,91,85,0.18)] sm:p-7">
      <h2 className="font-display text-lg font-bold text-charcoal">
        {FREE_PLAN.name}
      </h2>
      <p className="mt-1 text-sm text-charcoal/60">{FREE_PLAN.blurb}</p>
      <p className="mt-5">
        <span className="font-display text-3xl font-bold text-charcoal">
          {FREE_PLAN.price}
        </span>
        <span className="ml-1.5 text-xs text-charcoal/55">forever</span>
      </p>
      <ul className="mt-5 space-y-2.5 border-t border-charcoal/10 pt-5">
        {FREE_PLAN.included.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-charcoal/75">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal"
              strokeWidth={2.5}
              aria-label="Included"
            />
            <span>{item}</span>
          </li>
        ))}
        {FREE_PLAN.excluded.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-charcoal/55">
            <Minus
              className="mt-0.5 h-4 w-4 shrink-0 text-charcoal/40"
              strokeWidth={2.5}
              aria-label="Not included"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href={FREE_PLAN.href}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-deep-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark sm:w-auto"
      >
        {FREE_PLAN.cta}
      </Link>
    </div>
  );
}

function PricingFaqs() {
  return (
    <div className="mt-16 max-w-3xl">
      <h2 className="font-display text-2xl font-bold tracking-tight text-charcoal">
        Questions
      </h2>
      <div className="mt-6 divide-y divide-charcoal/10 border-y border-charcoal/10">
        {PRICING_FAQS.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-base font-semibold text-charcoal marker:hidden [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-charcoal/50 transition-transform group-open:rotate-180"
                strokeWidth={2}
              />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-charcoal/65">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
