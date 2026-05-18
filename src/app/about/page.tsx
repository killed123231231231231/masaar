import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "About — Masaar" };

export default function AboutPage() {
  return (
    <MarketingShell title="About Masaar">
      <p>
        Masaar (مسار — “path”) is built by Usama for businesses across the
        GCC. The idea is simple: a printed QR code shouldn’t be a dead end.
        It should be a path you can re-route, measure, and improve long
        after the ink dries.
      </p>
      <p>
        We’re Arabic-first and Gulf-focused by design — not a generic tool
        with a translation bolted on. Pricing is in riyals, data sits in the
        region, and the roadmap is driven by what GCC retailers, restaurants
        and event teams actually need.
      </p>
    </MarketingShell>
  );
}
