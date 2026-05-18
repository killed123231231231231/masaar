import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Resources — Masaar" };

export default function ResourcesPage() {
  return (
    <MarketingShell
      title="Resources"
      intro="Guides and docs coming soon."
    >
      <p>
        We’re writing setup guides, QR best practices, and API docs. In the
        meantime, the builder is self-explanatory — create a code and the
        options speak for themselves.
      </p>
    </MarketingShell>
  );
}
