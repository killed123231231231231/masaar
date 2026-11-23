import MarketingShell from "@/components/marketing-shell";
import PricingClient from "./pricing-client";

export const metadata = {
  title: "Pricing — Vertexa QR",
  description:
    "Vertexa QR is free: up to 25 dynamic QR codes per account with scan analytics. No card needed.",
};

// One Free plan. Vertexa QR is a free product (PAYMENTS_ENABLED stays
// false); the plan card and FAQ live in the client component.
export default function PricingPage() {
  return (
    <MarketingShell
      title="Pricing"
      intro={<>Vertexa QR is free to use. No card, no trial period.</>}
      wide
    >
      <PricingClient />
    </MarketingShell>
  );
}
