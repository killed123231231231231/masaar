"use client";

import {
  Globe, FileText, Image as ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet, Share2, QrCode, Sparkles, type LucideIcon,
} from "lucide-react";
import { CONTENT_TYPES, type WizardType } from "../_lib/types";

const ICONS: Record<string, LucideIcon> = {
  Globe, FileText, Image: ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet, Share2,
};

export default function Step1Type({
  selected,
  onSelect,
}: {
  selected: WizardType | null;
  onSelect: (t: WizardType) => void;
}) {
  const selMeta = selected
    ? CONTENT_TYPES.find((c) => c.key === selected) ?? null
    : null;

  return (
    /* 2-column split — left card grid ~64%, right preview ~36%, with a
       vertical divider that spans the full content height (min-h-full,
       so it runs under the stepper down to the footer). getqr layout. */
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[64fr_36fr]">
      {/* LEFT — heading + subheading + compact card grid. ~90px left
          padding on wide desktop; bottom padding clears the footer. */}
      <div className="px-6 pb-16 pt-12 sm:px-10 lg:pb-20 lg:pl-[90px] lg:pr-12 lg:pt-[60px]">
        <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-tight text-charcoal lg:text-[34px]">
          What do you want to create?
        </h1>
        <p className="mt-2 text-[17px] text-[#6B7280] lg:text-[18px]">
          Select a QR code type to get started in seconds.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_TYPES.map((c) => {
            const Icon = ICONS[c.icon] ?? QrCode;
            const active = selected === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                /* Compact getqr card: ~150px tall, bare teal icon near
                   the top, centered title + description. Visible-but-
                   subtle teal border; teal on hover/selected. */
                className={`relative flex min-h-[150px] flex-col items-center rounded-xl border-[1.3px] px-4 pb-5 pt-6 text-center transition duration-150 hover:-translate-y-0.5 hover:border-deep-teal hover:shadow-[0_10px_24px_rgba(15,91,85,0.10)] ${
                  active
                    ? "border-deep-teal bg-deep-teal/[0.04] shadow-[0_12px_28px_rgba(15,91,85,0.14)]"
                    : "border-deep-teal/20"
                }`}
              >
                {c.badge && (
                  <span
                    /* Pill straddles the TOP-CENTER border of the card. */
                    className={`absolute left-1/2 -top-[11px] flex h-[22px] -translate-x-1/2 items-center whitespace-nowrap rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider ${
                      c.badge === "Coming soon"
                        ? "bg-charcoal/10 text-charcoal/55"
                        : "bg-deep-teal text-white"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
                <Icon className="h-8 w-8 text-deep-teal" strokeWidth={1.75} />
                <h3 className="mt-3 font-display text-[17px] font-bold leading-tight text-charcoal">
                  {c.label}
                </h3>
                <p className="mt-2 text-[14px] leading-snug text-[#6B7280]">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — sticky preview. Vertical divider via border-l. Preview
          card ~290px square; heading + body below, all centered. */}
      <aside className="hidden px-8 pb-16 pt-[60px] lg:block lg:border-l lg:border-[#E5E7EB] lg:px-10">
        <div className="sticky top-[60px] flex flex-col items-center">
          <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-[30px] bg-deep-teal/[0.05] p-8">
            <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-deep-teal shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="grid h-full w-full place-items-center">
              <DashedQrPlaceholder />
            </div>
          </div>
          <h3 className="mt-6 text-center font-display text-[28px] font-bold leading-tight text-charcoal">
            {selMeta ? `${selMeta.label} QR` : "Create Your Perfect QR Code"}
          </h3>
          <p className="mt-2 max-w-[360px] text-center text-[15px] leading-relaxed text-[#6B7280]">
            {selMeta
              ? "Looking good — continue to add your content."
              : "Choose a type to see your personalized, dynamic QR code come to life."}
          </p>
        </div>
      </aside>
    </div>
  );
}

/* A decorative QR-shaped placeholder — 3 dashed finder-pattern corners
   + a few solid alignment dots, in brand teal at low alpha. Pure SVG so
   it always renders (no JS / hydration race). */
function DashedQrPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" className="h-3/5 w-3/5 text-deep-teal" aria-hidden>
      <g stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" fill="none" opacity="0.55">
        <rect x="6" y="6" width="22" height="22" rx="2" />
        <rect x="72" y="6" width="22" height="22" rx="2" />
        <rect x="6" y="72" width="22" height="22" rx="2" />
      </g>
      <g fill="currentColor" opacity="0.75">
        <rect x="12" y="12" width="10" height="10" rx="1" />
        <rect x="78" y="12" width="10" height="10" rx="1" />
        <rect x="12" y="78" width="10" height="10" rx="1" />
        <rect x="44" y="44" width="6" height="6" />
        <rect x="54" y="54" width="6" height="6" />
        <rect x="66" y="44" width="6" height="6" />
        <rect x="76" y="58" width="6" height="6" />
        <rect x="66" y="70" width="6" height="6" />
        <rect x="80" y="80" width="6" height="6" />
      </g>
    </svg>
  );
}
