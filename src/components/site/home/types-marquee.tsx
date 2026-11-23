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
import WhatsAppIcon from "@/components/icons/whatsapp";
import Reveal from "@/components/motion/reveal";

/** The 12 QR types offered in the builder (/create). */
export const QR_TYPES: { label: string; icon: LucideIcon }[] = [
  { label: "Website", icon: Globe },
  { label: "WhatsApp", icon: WhatsAppIcon },
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

/** Pastel icon wells, cycled so neighbouring types never share a colour. */
const WELLS = ["bg-lilac/70", "bg-sky/70", "bg-mint/70", "bg-blush/80", "bg-lime/80"];

type Item = { label: string; icon: LucideIcon; well: string };

const ROW_A: Item[] = QR_TYPES.map((t, i) => ({ ...t, well: WELLS[i % WELLS.length] }));
// Second row starts halfway through the list and shifts the colours, so the
// two rows never line up the same type or tint.
const ROW_B: Item[] = [...QR_TYPES.slice(6), ...QR_TYPES.slice(0, 6)].map((t, i) => ({
  ...t,
  well: WELLS[(i + 2) % WELLS.length],
}));

function Row({ items, hidden = false }: { items: Item[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-4 pr-4 md:gap-5 md:pr-5">
      {items.map(({ label, icon: Icon, well }) => (
        <li
          key={label}
          className="flex shrink-0 items-center gap-3.5 rounded-full border border-stone-dark/70 bg-white py-2 pl-2 pr-6 font-heading text-lg font-medium text-ink shadow-card transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:text-xl"
        >
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${well}`}>
            <Icon className="h-6 w-6 text-ink" strokeWidth={1.9} aria-hidden />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

function Track({ items, duration, reverse = false }: { items: Item[]; duration: string; reverse?: boolean }) {
  return (
    <div
      className="flex w-max animate-marquee py-3 hover:[animation-play-state:paused]"
      style={{ animationDuration: duration, animationDirection: reverse ? "reverse" : "normal" }}
    >
      <Row items={items} />
      <Row items={items} hidden />
    </div>
  );
}

/**
 * Two slow marquee rows of QR types moving in opposite directions. Rows
 * pause on hover and stand still for reduced-motion users (globals.css).
 */
export default function TypesMarquee() {
  return (
    <section aria-labelledby="types-title" className="py-12 md:py-16">
      <Reveal>
        <h2 id="types-title" className="px-4 text-center font-body text-lg text-muted md:text-[21px]">
          Make a QR code for anything
        </h2>
      </Reveal>
      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] md:mt-8">
        <Track items={ROW_A} duration="60s" />
        <Track items={ROW_B} duration="70s" reverse />
      </div>
    </section>
  );
}
