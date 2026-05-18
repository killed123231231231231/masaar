import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Terms & Conditions — Masaar" };

export default function TermsPage() {
  return (
    <MarketingShell
      title="Terms & Conditions"
      intro="Placeholder terms — full legal copy is being prepared."
    >
      <p>
        By using Masaar you agree to use the service lawfully and not to
        encode malicious, illegal, or infringing destinations in your QR
        codes. Dynamic QR destinations remain editable by the owning
        account.
      </p>
      <p>
        This is a pre-launch placeholder. Final Terms & Conditions will
        replace this page before public launch.
      </p>
    </MarketingShell>
  );
}
