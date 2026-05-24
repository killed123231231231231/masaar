"use client";

import {
  Globe, FileText, Image as ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet, QrCode, Sparkles, type LucideIcon,
} from "lucide-react";
import { CONTENT_TYPES, type WizardType } from "../_lib/types";

const ICONS: Record<string, LucideIcon> = {
  Globe, FileText, Image: ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet,
};

export default function Step1Type({
  selected,
  onSelect,
}: {
  selected: WizardType | null;
  onSelect: (t: WizardType) => void;
}) {
  const SelIcon = selected
    ? ICONS[CONTENT_TYPES.find((c) => c.key === selected)!.icon]
    : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      {/* LEFT — page header + card grid. pt-8 lg:pt-12 opens the gap
          to the sticky step bar so the title isn't crowded. */}
      <div className="pt-8 lg:pt-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal lg:text-[2rem]">
          What do you want to create?
        </h1>
        <p className="mt-2 text-sm text-charcoal/55">
          Select a QR code type to get started in seconds.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_TYPES.map((c) => {
            const Icon = ICONS[c.icon] ?? QrCode;
            const active = selected === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                /* Centered icon + label + description per the
                   reference. Border-2 in both states so the geometry
                   doesn't shift on selection. Generous px-6 py-7
                   padding so the card reads as "tile", not "chip". */
                className={`relative rounded-2xl border-2 px-6 py-7 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-deep-teal bg-deep-teal/5"
                    : "border-deep-teal/15 bg-white hover:border-deep-teal/40"
                }`}
              >
                {c.badge && (
                  <span
                    /* Badge straddles the top border, centered. Solid
                       deep-teal pill for MOST USED, muted for Coming
                       soon. */
                    className={`absolute left-1/2 -top-3 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      c.badge === "Coming soon"
                        ? "bg-charcoal/10 text-charcoal/55"
                        : "bg-deep-teal text-white"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-deep-teal/10 text-deep-teal">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-charcoal">
                  {c.label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-charcoal/55">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — dedicated preview slot. Bigger, more prominent,
          dashed-outline QR mockup when no type is picked, the type's
          icon when one is. Sparkle badge top-right matches the
          reference's decorative flourish. */}
      <aside className="hidden lg:block lg:pt-12">
        <div className="sticky top-28">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-deep-teal/[0.06] p-10">
            <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-deep-teal/15 text-deep-teal">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="grid h-full w-full place-items-center">
              {SelIcon ? (
                <div className="text-center">
                  <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-white text-deep-teal shadow-sm">
                    <SelIcon className="h-12 w-12" strokeWidth={1.5} />
                  </span>
                  <p className="mt-5 font-display text-base font-bold text-charcoal">
                    {CONTENT_TYPES.find((c) => c.key === selected)!.label}
                  </p>
                </div>
              ) : (
                <DashedQrPlaceholder />
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* A decorative QR-shaped placeholder — 3 dashed finder-pattern
   corners + a few solid alignment dots, in the brand teal at low
   alpha. Mirrors the mockup's right-panel illustration. */
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
