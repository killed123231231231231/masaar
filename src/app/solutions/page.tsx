import Link from "next/link";
import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Solutions — Masaar" };

export default function SolutionsPage() {
  return (
    <MarketingShell
      title="Who uses Masaar"
      intro="Retail, hospitality, real estate, events, travel and healthcare teams across the Gulf."
    >
      <p>
        Restaurants put an editable QR on every table; retailers link
        packaging to live promos; event organizers swap a poster’s
        destination mid-campaign — all without reprinting.
      </p>
      <p>
        A dedicated restaurant menu product is on the way.{" "}
        <span className="font-medium text-charcoal">Coming soon</span> — for
        now,{" "}
        <Link href="/" className="font-semibold text-deep-teal hover:underline">
          explore the platform
        </Link>
        .
      </p>
    </MarketingShell>
  );
}
