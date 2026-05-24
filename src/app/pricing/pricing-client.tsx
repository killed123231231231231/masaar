"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Minus } from "lucide-react";

// 5-tier comparison per STRATEGY.md §5. Numbers are early estimates;
// the pricing-FAQ at the bottom is honest about that.
type Cadence = "monthly" | "annual";

interface Tier {
  name: string;
  monthly: number;     // SAR/mo when billed monthly
  annual: number;      // SAR/mo when billed annually (already discounted)
  blurb: string;
  cta: string;
  href: string;
  featured?: boolean;
  contactSales?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    blurb: "Try Masaar with no card.",
    cta: "Start free",
    href: "/create",
  },
  {
    name: "Starter",
    monthly: 29,
    annual: 23,
    blurb: "For solo operators and side projects.",
    cta: "Start Starter",
    href: "/create",
  },
  {
    name: "Pro",
    monthly: 99,
    annual: 79,
    blurb: "Everything most businesses need.",
    cta: "Start Pro",
    href: "/create",
    featured: true,
  },
  {
    name: "Menu Pro",
    monthly: 199,
    annual: 159,
    blurb: "Built for Saudi cafes + restaurants.",
    cta: "Start Menu Pro",
    href: "/create",
  },
  {
    name: "Agency",
    monthly: 399,
    annual: 319,
    blurb: "Multi-brand teams + white-label.",
    cta: "Talk to us",
    href: "/contact",
    contactSales: true,
  },
];

// Annual discount in % (computed off the Pro tier since it's the
// reference; all tiers discount by approximately the same proportion).
const ANNUAL_SAVINGS_PCT = Math.round(
  ((TIERS[2].monthly - TIERS[2].annual) / TIERS[2].monthly) * 100
);

// Feature comparison matrix. Each row = a feature category; cells
// describe what the tier ships for that feature. Honest about
// roadmap items: "Coming" + when, never a fake checkmark.
//
// `cells` is keyed by tier name; missing values default to empty cell.
type CellValue = string | true | null;
interface FeatureRow {
  category: string;
  feature: string;
  cells: Record<string, CellValue>;
}

const FEATURE_GROUPS: { title: string; rows: FeatureRow[] }[] = [
  {
    title: "QR codes",
    rows: [
      {
        category: "core",
        feature: "Dynamic QR codes",
        cells: { Free: "5 codes", Starter: "50 codes", Pro: "Unlimited", "Menu Pro": "Unlimited", Agency: "Unlimited" },
      },
      {
        category: "core",
        feature: "Static QR codes",
        cells: { Free: true, Starter: true, Pro: true, "Menu Pro": true, Agency: true },
      },
      {
        category: "core",
        feature: "Edit destination after print",
        cells: { Free: true, Starter: true, Pro: true, "Menu Pro": true, Agency: true },
      },
      {
        category: "core",
        feature: "Password-protected QR",
        cells: { Free: null, Starter: null, Pro: "Coming Session I", "Menu Pro": "Coming Session I", Agency: "Coming Session I" },
      },
    ],
  },
  {
    title: "Analytics",
    rows: [
      {
        category: "analytics",
        feature: "Scan trend + geo + device",
        cells: { Free: "Last 30 days", Starter: "All time", Pro: "All time", "Menu Pro": "All time", Agency: "All time" },
      },
      {
        category: "analytics",
        feature: "Per-QR analytics drilldown",
        cells: { Free: null, Starter: true, Pro: true, "Menu Pro": true, Agency: true },
      },
      {
        category: "analytics",
        feature: "CSV export",
        cells: { Free: null, Starter: true, Pro: true, "Menu Pro": true, Agency: true },
      },
    ],
  },
  {
    title: "Branding & customization",
    rows: [
      {
        category: "branding",
        feature: "Logo + colors + dot styles",
        cells: { Free: "Basic", Starter: true, Pro: true, "Menu Pro": true, Agency: true },
      },
      {
        category: "branding",
        feature: "Frame library (20+ styles)",
        cells: { Free: null, Starter: null, Pro: "Coming Session I", "Menu Pro": "Coming Session I", Agency: "Coming Session I" },
      },
      {
        category: "branding",
        feature: "Logo preset library",
        cells: { Free: null, Starter: null, Pro: "Coming Session I", "Menu Pro": "Coming Session I", Agency: "Coming Session I" },
      },
    ],
  },
  {
    title: "Menu vertical",
    rows: [
      {
        category: "menu",
        feature: "Menu builder + bilingual",
        cells: { Free: null, Starter: null, Pro: null, "Menu Pro": "Coming Session F", Agency: "Coming Session F" },
      },
      {
        category: "menu",
        feature: "AI menu import (paper → digital)",
        cells: { Free: null, Starter: null, Pro: null, "Menu Pro": "Coming Session F", Agency: "Coming Session F" },
      },
      {
        category: "menu",
        feature: "Photo CDN + allergen tags",
        cells: { Free: null, Starter: null, Pro: null, "Menu Pro": "Coming Session F", Agency: "Coming Session F" },
      },
    ],
  },
  {
    title: "Support & teams",
    rows: [
      {
        category: "support",
        feature: "Email support",
        cells: { Free: true, Starter: true, Pro: true, "Menu Pro": true, Agency: true },
      },
      {
        category: "support",
        feature: "Multi-seat workspace",
        cells: { Free: null, Starter: null, Pro: null, "Menu Pro": null, Agency: "Coming Sprint 3" },
      },
      {
        category: "support",
        feature: "Dedicated CSM",
        cells: { Free: null, Starter: null, Pro: null, "Menu Pro": null, Agency: "Coming Sprint 3" },
      },
    ],
  },
];

const PRICING_FAQS = [
  {
    q: "Annual vs monthly — when does the discount kick in?",
    a: `Annual billing discounts ~${ANNUAL_SAVINGS_PCT}% off the equivalent monthly rate. You're billed once at the start of the year; the dashboard shows your renewal date upfront. Switch between monthly and annual anytime from Settings.`,
  },
  {
    q: "What counts as a scan?",
    a: "Any successful hit to /r/<your-qr> that resolves to your destination. Bot traffic (Slackbot, WhatsApp link previews, headless browsers) is filtered out before counting against your tier limits or showing up in your dashboard.",
  },
  {
    q: "Does it support Mada / STC Pay / Tap?",
    a: "Not yet — payments are scaffolded but the actual gateway wiring lands in Sprint 3. We're being deliberate: Saudi customers need Mada and Apple Pay first, not Stripe-only. Until then, activation is on a SAR-priced launch promo. We'll never charge a card you didn't put in.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — one click in Settings → Plan. Your existing QR codes stay valid: static ones forever, dynamic ones either revert to a Masaar landing page (Free tier) or stay live if you re-activate within 90 days. No auto-renewal surprises, no \"I don't recognize this charge\" surprise.",
  },
  {
    q: "Do I need to talk to sales for the Agency tier?",
    a: "Yes — Agency is white-label + multi-seat + dedicated CSM, and we want to match the deal to your real use case (number of brands, scan volume, regional rollout). Hit Talk to us above and we'll set up a short call.",
  },
];

export default function PricingClient() {
  const [cadence, setCadence] = useState<Cadence>("annual");

  return (
    <>
      <CadenceToggle cadence={cadence} setCadence={setCadence} />
      <TierGrid cadence={cadence} />
      <FeatureMatrix />
      <PricingFaqs />
      <FinalSalesCta />
    </>
  );
}

function CadenceToggle({
  cadence,
  setCadence,
}: {
  cadence: Cadence;
  setCadence: (c: Cadence) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
      <div
        role="tablist"
        aria-label="Billing cadence"
        className="inline-flex rounded-full border border-charcoal/15 bg-white p-1"
      >
        <button
          role="tab"
          aria-selected={cadence === "monthly"}
          onClick={() => setCadence("monthly")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            cadence === "monthly"
              ? "bg-deep-teal text-white"
              : "text-charcoal/65 hover:text-deep-teal"
          }`}
        >
          Monthly
        </button>
        <button
          role="tab"
          aria-selected={cadence === "annual"}
          onClick={() => setCadence("annual")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            cadence === "annual"
              ? "bg-deep-teal text-white"
              : "text-charcoal/65 hover:text-deep-teal"
          }`}
        >
          Annual
        </button>
      </div>
      <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-terracotta-dark">
        Save {ANNUAL_SAVINGS_PCT}%
      </span>
    </div>
  );
}

function TierGrid({ cadence }: { cadence: Cadence }) {
  return (
    <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-5 lg:items-end">
      {TIERS.map((tier) => {
        const price = cadence === "annual" ? tier.annual : tier.monthly;
        const showCadence = price > 0 ? "per month" : "forever";
        const isFree = tier.monthly === 0;
        return (
          <li
            key={tier.name}
            className={`relative rounded-2xl border bg-white p-5 ${
              tier.featured
                ? "border-deep-teal/40 shadow-[0_8px_32px_-12px_rgba(15,91,85,0.18)] lg:-mt-3 lg:mb-3"
                : "border-charcoal/10"
            }`}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-deep-teal px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Most popular
              </span>
            )}
            <h3 className="font-display text-lg font-bold">{tier.name}</h3>
            <p className="mt-1 min-h-[2.5rem] text-xs text-charcoal/55">{tier.blurb}</p>
            <p className="mt-4">
              {tier.contactSales ? (
                <span className="font-display text-2xl font-bold text-charcoal">
                  Custom
                </span>
              ) : (
                <>
                  <span className="font-display text-2xl font-bold text-charcoal">
                    SAR {price}
                  </span>
                  <span className="ml-1 text-xs text-charcoal/55">
                    /{isFree ? "" : "mo"}
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-[11px] text-charcoal/45">
              {tier.contactSales
                ? "Quoted per workspace"
                : isFree
                ? showCadence
                : cadence === "annual"
                ? `billed annually (SAR ${tier.annual * 12}/yr)`
                : "billed monthly"}
            </p>
            <Link
              href={tier.href}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                tier.featured
                  ? "bg-deep-teal text-white hover:bg-deep-teal-dark"
                  : "border border-charcoal/15 text-charcoal hover:bg-sand-light hover:text-deep-teal"
              }`}
            >
              {tier.cta}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FeatureMatrix() {
  return (
    <div className="mt-16">
      <h2 className="text-center font-display text-2xl font-bold tracking-tight">
        Compare features
      </h2>
      <p className="mt-2 text-center text-sm text-charcoal/55">
        Honest about what's live vs roadmap. Sessions referenced point to the
        sprint where each capability lands.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-charcoal/15 text-left">
              <th className="py-3 pr-4 font-display text-sm font-bold text-charcoal">
                Feature
              </th>
              {TIERS.map((t) => (
                <th
                  key={t.name}
                  className={`px-3 py-3 text-center font-display text-sm font-bold ${
                    t.featured ? "text-deep-teal" : "text-charcoal"
                  }`}
                >
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_GROUPS.map((group) => (
              <Group key={group.title} group={group} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Group({ group }: { group: { title: string; rows: FeatureRow[] } }) {
  return (
    <>
      <tr>
        <td
          colSpan={TIERS.length + 1}
          className="bg-sand-light/60 px-1 py-2 font-display text-[11px] font-bold uppercase tracking-widest text-charcoal/55"
        >
          {group.title}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.feature} className="border-b border-charcoal/5">
          <td className="py-3 pr-4 text-charcoal/80">{row.feature}</td>
          {TIERS.map((t) => (
            <td key={t.name} className="px-3 py-3 text-center text-charcoal/70">
              {renderCell(row.cells[t.name])}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function renderCell(v: CellValue) {
  if (v === true) {
    return <Check className="mx-auto h-4 w-4 text-deep-teal" strokeWidth={2.5} aria-label="Included" />;
  }
  if (v === null || v === undefined) {
    return <Minus className="mx-auto h-4 w-4 text-charcoal/25" strokeWidth={2.5} aria-label="Not included" />;
  }
  // String value — soft "Coming Session X" callouts use a muted tone
  // so they don't read as live features.
  const isComing = v.toLowerCase().startsWith("coming");
  return (
    <span className={`text-[12px] ${isComing ? "italic text-charcoal/45" : "font-medium text-charcoal/80"}`}>
      {v}
    </span>
  );
}

function PricingFaqs() {
  return (
    <div className="mt-16">
      <h2 className="text-center font-display text-2xl font-bold tracking-tight">
        Pricing questions
      </h2>
      <div className="mx-auto mt-8 max-w-3xl divide-y divide-charcoal/10 border-y border-charcoal/10">
        {PRICING_FAQS.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-charcoal/50 transition-transform group-open:rotate-180"
                strokeWidth={2}
              />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-charcoal/65">
              {a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function FinalSalesCta() {
  return (
    <div className="mt-16 rounded-3xl border border-charcoal/10 bg-sand-light/40 p-8 text-center lg:p-12">
      <h2 className="font-display text-2xl font-bold tracking-tight">
        Need something custom?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-charcoal/65">
        Multi-brand, white-label, regional rollout, dedicated support — Agency
        is built around the conversation. We'll match the deal to your real
        use case.
      </p>
      <Link
        href="/contact"
        className="mt-6 inline-flex items-center rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark"
      >
        Talk to us
      </Link>
    </div>
  );
}
