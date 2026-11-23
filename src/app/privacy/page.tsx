import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Privacy Policy · Vertexa QR" };

export default function PrivacyPage() {
  return (
    <MarketingShell
      title="Privacy Policy"
      intro="Placeholder policy. Full legal copy is being prepared."
    >
      <article className="max-w-2xl space-y-5 font-body text-[17px] leading-[1.65] text-muted-2">
        <p>
          Vertexa QR stores the data you enter to build QR codes and aggregated
          scan analytics (country, city, device, time). Scan IP addresses
          are hashed, never stored raw. We don’t sell personal data.
        </p>
        <p>
          This is a pre-launch placeholder. The final Privacy Policy will
          replace this page before public launch.
        </p>
      </article>
    </MarketingShell>
  );
}
