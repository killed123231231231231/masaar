import Link from "next/link";
import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Pricing — Masaar" };

// STRATEGY.md §5 pricing thesis (SAR/mo). Numbers are early estimates.
const TIERS = [
  {
    name: "Starter",
    monthly: 49,
    annual: 39,
    blurb: "Up to 5 dynamic QRs, basic analytics",
  },
  {
    name: "Pro",
    monthly: 99,
    annual: 79,
    blurb: "Unlimited QRs, full analytics, logo embed, custom design",
    featured: true,
  },
  {
    name: "Menu Pro",
    monthly: 199,
    annual: 149,
    blurb: "All Pro + menu builder, bilingual, photos, allergens",
  },
];

export default function PricingPage() {
  return (
    <MarketingShell
      title="Pricing"
      intro="SAR-first plans for GCC businesses. Start with a 7-day trial for SAR 5."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-6 ${
              t.featured
                ? "border-deep-teal bg-deep-teal/5 ring-1 ring-deep-teal/20"
                : "border-charcoal/10 bg-white"
            }`}
          >
            <h3 className="font-display text-lg font-bold">{t.name}</h3>
            <p className="mt-2">
              <span className="font-display text-3xl font-bold">
                SAR {t.monthly}
              </span>
              <span className="text-sm text-charcoal/50">/mo</span>
            </p>
            <p className="mt-1 text-xs text-charcoal/50">
              or SAR {t.annual}/mo billed annually
            </p>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/65">
              {t.blurb}
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm text-charcoal/55">
        Menu Pro + Ordering (table-side ordering) lands in a later release.
        Final pricing is being validated with the first customers.
      </p>
      <Link
        href="/create"
        className="inline-flex w-fit items-center rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta"
      >
        Create your QR — free to try
      </Link>
    </MarketingShell>
  );
}
