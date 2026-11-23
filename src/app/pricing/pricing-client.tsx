"use client";

import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Minus } from "lucide-react";

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
    // Sunbeam double frame: stone outer frame around a white inner card.
    <div className="max-w-xl rounded-panel bg-stone p-1.5 font-body">
      <div className="rounded-[26px] border border-stone-dark bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-medium text-ink">
            {FREE_PLAN.name}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink" />
            No card needed
          </span>
        </div>
        <p className="mt-1.5 text-[15px] text-muted-2">{FREE_PLAN.blurb}</p>
        <p className="mt-6 flex items-baseline gap-2">
          <span className="font-heading text-[44px] font-medium leading-none tracking-[-0.02em] text-ink sm:text-[54px]">
            {FREE_PLAN.price}
          </span>
          <span className="text-sm text-muted-3">forever</span>
        </p>
        <ul className="mt-6 space-y-3 border-t border-stone-dark pt-6">
          {FREE_PLAN.included.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[15px] text-ink">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime">
                <Check
                  className="h-3 w-3 text-ink"
                  strokeWidth={3}
                  aria-label="Included"
                />
              </span>
              <span>{item}</span>
            </li>
          ))}
          {FREE_PLAN.excluded.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[15px] text-muted-2">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-stone">
                <Minus
                  className="h-3 w-3 text-muted-3"
                  strokeWidth={3}
                  aria-label="Not included"
                />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link
          href={FREE_PLAN.href}
          className="group mt-8 inline-flex h-11 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-base font-medium text-ink transition-colors border border-stone-dark/70 bg-white shadow-[0_1px_2px_rgba(26,26,26,0.06)] hover:border-lime hover:bg-lime focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white transition-transform group-hover:translate-x-0.5">
            <ChevronRight className="h-4 w-4" />
          </span>
          {FREE_PLAN.cta}
        </Link>
      </div>
    </div>
  );
}

function PricingFaqs() {
  return (
    <div className="mt-16 max-w-3xl font-body">
      <h2 className="font-heading text-[32px] font-medium tracking-[-0.02em] text-ink sm:text-[42px]">
        Questions
      </h2>
      <div className="mt-6 space-y-3">
        {PRICING_FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-card border border-stone-dark bg-white px-5 transition-shadow open:shadow-card sm:px-6"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card py-5 font-heading text-lg font-medium text-ink marker:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 [&::-webkit-details-marker]:hidden">
              {q}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone transition-colors group-open:bg-lime">
                <ChevronDown
                  className="h-4 w-4 text-ink transition-transform group-open:rotate-180"
                  strokeWidth={2}
                />
              </span>
            </summary>
            <p className="pb-5 text-base leading-relaxed text-muted-2">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
