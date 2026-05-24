import MarketingShell from "@/components/marketing-shell";
import PricingClient from "./pricing-client";

export const metadata = {
  title: "Pricing — Masaar",
  description:
    "SAR-priced plans for GCC businesses. Free tier ships real value, no $1 trial trap, no auto-renewal surprises.",
};

// B6 — full /pricing page. The /-landing's PricingTeaser surfaces 3
// representative tiers and links here for the deep view. This page is
// the deep view: 5 tiers (Free / Starter / Pro / Menu Pro / Agency),
// annual toggle with savings, feature comparison matrix, pricing-
// specific FAQ. Per STRATEGY.md §5.
//
// Server-component shell + a client island for the monthly/annual
// toggle interactivity.
export default function PricingPage() {
  return (
    <MarketingShell
      title="Plans that grow with you"
      intro={
        <>
          SAR-priced, no surprise renewals. Start free, upgrade when your scans
          outgrow the limit.
        </>
      }
      wide
    >
      <PricingClient />
    </MarketingShell>
  );
}
