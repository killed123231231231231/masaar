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
    /* No vertical divider between the grid and the preview — getqr has
       none (the old border-l ran up into the header). Just a wide column
       gap, left grid + right sticky preview. */
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      {/* LEFT — header + "Most used" caption + card grid. */}
      <div className="pt-8 lg:pt-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal lg:text-[2rem]">
          What do you want to create?
        </h1>
        <p className="mt-2 text-sm text-charcoal/55">
          Select a QR code type to get started in seconds.
        </p>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/45">
          Most used
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_TYPES.map((c) => {
            const Icon = ICONS[c.icon] ?? QrCode;
            const active = selected === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                /* getqr card: flat white tile, light border, bare teal
                   icon (no chip), bold title, gray description, all
                   centered. Lifts on hover; selected = teal border+tint+ring. */
                className={`group relative rounded-2xl border bg-white px-6 py-7 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-deep-teal bg-deep-teal/[0.04] ring-1 ring-deep-teal"
                    : "border-charcoal/10 hover:border-deep-teal/40"
                }`}
              >
                {c.badge && (
                  <span
                    /* getqr: pill straddles the TOP-CENTER border. */
                    className={`absolute left-1/2 -top-2.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      c.badge === "Coming soon"
                        ? "bg-charcoal/10 text-charcoal/55"
                        : "bg-deep-teal text-white"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
                <Icon className="mx-auto h-8 w-8 text-deep-teal" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg font-bold text-charcoal">
                  {c.label}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-charcoal/55">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — sticky preview. Neutral light-gray panel (getqr uses
          gray, not a teal tint), sparkle top-right, QR motif centered,
          heading + subcopy below. No divider line. */}
      <aside className="hidden lg:block lg:pt-12">
        <div className="sticky top-28">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-charcoal/[0.04] p-8">
            <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-deep-teal shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="grid h-full w-full place-items-center">
              <DashedQrPlaceholder />
            </div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="font-display text-xl font-bold text-charcoal">
              {selMeta ? `${selMeta.label} QR` : "Create Your Perfect QR Code"}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-charcoal/55">
              {selMeta
                ? "Looking good — continue to add your content."
                : "Choose a type to see your personalized, dynamic QR code come to life."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* A decorative QR-shaped placeholder — 3 dashed finder-pattern
   corners + a few solid alignment dots, in the brand teal at low
   alpha. Mirrors getqr's right-panel illustration. Pure SVG so it
   always renders (no JS / hydration race). */
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
