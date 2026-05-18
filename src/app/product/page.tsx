import MarketingShell from "@/components/marketing-shell";

export const metadata = { title: "Product — Masaar" };

export default function ProductPage() {
  return (
    <MarketingShell
      title="What Masaar does"
      intro="Masaar turns any printed QR code into a destination you control forever."
    >
      <p>
        Every Masaar code points at a short link you own. Change where it
        goes, see every scan in real time, and never reprint — whether it’s
        on packaging, signage, a menu, or a business card.
      </p>
      <p>
        Built for GCC businesses: Arabic-first, regional data, and content
        types that go beyond a plain URL — WhatsApp, vCard, WiFi, app links
        and more.
      </p>
    </MarketingShell>
  );
}
