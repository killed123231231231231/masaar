import {
  Contact,
  FileText,
  Globe,
  Image as ImageIcon,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Share2,
  Star,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import Reveal from "@/components/motion/reveal";

/** The 12 QR types offered in the builder (/create). */
export const QR_TYPES: { label: string; icon: LucideIcon }[] = [
  { label: "Website", icon: Globe },
  { label: "WhatsApp", icon: MessageCircle },
  { label: "PDF", icon: FileText },
  { label: "WiFi", icon: Wifi },
  { label: "vCard", icon: Contact },
  { label: "Social media", icon: Share2 },
  { label: "Image", icon: ImageIcon },
  { label: "App link", icon: Link2 },
  { label: "Email", icon: Mail },
  { label: "SMS", icon: MessageSquare },
  { label: "Location", icon: MapPin },
  { label: "Feedback", icon: Star },
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14">
      {QR_TYPES.map(({ label, icon: Icon }) => (
        <li key={label} className="flex shrink-0 items-center gap-3 font-heading text-xl font-medium text-muted md:text-[22px]">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-stone-dark bg-white">
            <Icon className="h-5 w-5 text-ink" aria-hidden />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Slow marquee of QR types (replaces Sunbeam's customer-logo row). */
export default function TypesMarquee() {
  return (
    <section aria-labelledby="types-title" className="py-12 md:py-16">
      <Reveal>
        <h2 id="types-title" className="px-4 text-center font-body text-lg text-muted md:text-[21px]">
          Make a QR code for anything
        </h2>
      </Reveal>
      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]" style={{ animationDuration: "55s" }}>
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
