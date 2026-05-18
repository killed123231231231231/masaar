import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Privacy Policy — Masaar" };

export default function PrivacyPage() {
  return (
    <MarketingShell
      title="Privacy Policy"
      intro="Placeholder policy — full legal copy is being prepared."
    >
      <p>
        Masaar stores the data you enter to build QR codes and aggregated
        scan analytics (country, city, device, time). Scan IP addresses
        are hashed, never stored raw. We don’t sell personal data.
      </p>
      <p>
        This is a pre-launch placeholder. The final Privacy Policy will
        replace this page before public launch.
      </p>
    </MarketingShell>
  );
}
