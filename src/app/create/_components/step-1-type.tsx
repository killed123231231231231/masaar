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
    // Content wrapper — getqr `mx-auto w-full md:px-8`, min-h-full so the
    // divider + row span the full content height.
    <div className="mx-auto flex min-h-full w-full flex-col px-4 pt-8 sm:px-6 md:px-8 md:pt-12">
      <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-tight text-charcoal md:text-[34px]">
        What do you want to create?
      </h1>
      <p className="mt-2 text-[16px] text-[#6B7280] md:text-[18px]">
        Select a QR code type to get started in seconds.
      </p>

      {/* getqr 2-column row: grid (flex-1) | 1px divider | fixed preview.
          `flex gap-8 xl:gap-12 flex-1 pb-8`. */}
      <div className="mt-6 flex flex-1 gap-8 pb-8 xl:gap-12">
        {/* LEFT — card grid IS the flex-1 child (getqr). */}
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
          {CONTENT_TYPES.map((c) => {
            const Icon = ICONS[c.icon] ?? QrCode;
            const active = selected === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                /* getqr card: rounded-xl, ring (not border), small padding
                   (xl:px-6 xl:py-4), content vertically centered, ~140px.
                   ring-1 default → hover ring-2 + shadow; selected teal. */
                className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-visible rounded-xl p-3 text-center transition-all duration-300 ease-in-out max-lg:min-h-[150px] lg:px-3 lg:py-2.5 xl:px-6 xl:py-4 ${
                  active
                    ? "bg-deep-teal/[0.04] ring-2 ring-deep-teal"
                    : "bg-white ring-1 ring-deep-teal/25 hover:shadow-md hover:ring-2 hover:ring-deep-teal"
                }`}
              >
                {c.badge && (
                  <span
                    /* Pill straddles the TOP-CENTER border. */
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
                <p className="mt-1.5 text-[14px] leading-snug text-[#6B7280]">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* DIVIDER — 1px, full row height (getqr `w-px self-stretch`). */}
        <div
          aria-hidden
          className="hidden w-px shrink-0 self-stretch bg-[#E5E7EB] lg:block"
        />

        {/* RIGHT — fixed-width preview (getqr `w-[280px] xl:w-[360px]`). */}
        <div className="hidden w-[280px] shrink flex-col items-center text-center lg:flex xl:w-[360px]">
          <div className="relative mb-8 xl:mb-10">
            <div className="flex h-48 w-48 items-center justify-center rounded-3xl bg-deep-teal/10 xl:h-64 xl:w-64">
              <DashedQrPlaceholder />
            </div>
            <span className="absolute -right-2 -top-2 grid h-10 w-10 place-items-center rounded-full bg-deep-teal/20 text-deep-teal xl:-right-3 xl:-top-3 xl:h-12 xl:w-12">
              <Sparkles className="h-4 w-4 xl:h-5 xl:w-5" />
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-charcoal xl:text-2xl">
            {selMeta ? `${selMeta.label} QR` : "Create Your Perfect QR Code"}
          </h3>
          <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-[#6B7280] xl:max-w-[320px] xl:text-base">
            {selMeta
              ? "Looking good — continue to add your content."
              : "Choose a type to see your personalized, dynamic QR code come to life."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Decorative QR-shaped placeholder — pure SVG so it always renders. */
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
