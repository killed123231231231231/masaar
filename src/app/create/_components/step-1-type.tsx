"use client";

import {
  Globe, FileText, Image as ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet, Share2, QrCode, Check, type LucideIcon,
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
  const SelIcon = selMeta ? ICONS[selMeta.icon] ?? QrCode : QrCode;

  return (
    // min-h-full so the divider + row span the full content height.
    <div className="mx-auto flex min-h-full w-full flex-col px-4 pt-6 sm:px-6 md:px-8 md:pt-10">
      <h1 className="font-heading text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-ink md:text-[42px]">
        What do you want to create?
      </h1>
      <p className="mt-2 font-body text-base text-muted md:text-lg">
        Pick a QR code type to get started.
      </p>

      {/* Two-column row: tile grid (flex-1) | divider | live preview. */}
      <div className="mt-6 flex flex-1 gap-8 pb-8 xl:gap-12">
        <div
          role="group"
          aria-label="QR code type"
          className="grid min-w-0 flex-1 grid-cols-1 content-start min-[420px]:auto-rows-fr gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:gap-4"
        >
          {CONTENT_TYPES.map((c) => {
            const Icon = ICONS[c.icon] ?? QrCode;
            const active = selected === c.key;
            const soon = c.badge === "Coming soon";
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(c.key)}
                className={`group relative flex cursor-pointer items-start gap-3 rounded-card border bg-white p-4 text-left transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 ${
                  active
                    ? "border-ink shadow-card"
                    : "border-stone-dark hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-card"
                }`}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${
                    active ? "bg-lime text-ink" : "bg-stone text-ink group-hover:bg-stone-dark"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1 pr-6">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-heading text-[17px] font-semibold leading-tight text-ink">
                      {c.label}
                    </span>
                    {c.badge && (
                      <span
                        className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 font-body text-[10px] font-semibold uppercase tracking-wider ${
                          soon ? "bg-stone text-muted-2" : "bg-lime text-ink"
                        }`}
                      >
                        {c.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block font-body text-sm leading-snug text-muted-2">
                    {c.desc}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full transition-all ${
                    active
                      ? "scale-100 bg-ink text-lime opacity-100"
                      : "scale-75 border border-stone-dark opacity-100"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        <div
          aria-hidden
          className="hidden w-px shrink-0 self-stretch bg-stone-dark lg:block"
        />

        {/* RIGHT — sticky preview on a pastel grain frame. */}
        <div className="hidden w-[280px] shrink-0 lg:block xl:w-[340px]">
          <div className="sticky top-6">
            <div className="grain relative overflow-hidden rounded-panel bg-lilac p-6 xl:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-white/40 blur-2xl"
              />
              <div className="relative mx-auto aspect-square w-full max-w-[220px] rounded-card bg-white p-6 shadow-float">
                <DashedQrPlaceholder />
                <span className="absolute -right-3 -top-3 grid h-11 w-11 place-items-center rounded-full bg-ink text-lime shadow-card">
                  <SelIcon className="h-5 w-5" />
                </span>
              </div>
            </div>
            <h2 className="mt-6 font-heading text-2xl font-medium leading-tight text-ink">
              {selMeta ? `${selMeta.label} QR` : "Your QR code"}
            </h2>
            <p className="mt-2 font-body text-[15px] leading-relaxed text-muted-2">
              {selMeta
                ? "Good choice. Press Next to add your content."
                : "Choose a type and your QR code takes shape here."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Decorative QR-shaped placeholder — pure SVG so it always renders. */
function DashedQrPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full text-ink" aria-hidden>
      <g stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" fill="none" opacity="0.35">
        <rect x="6" y="6" width="22" height="22" rx="4" />
        <rect x="72" y="6" width="22" height="22" rx="4" />
        <rect x="6" y="72" width="22" height="22" rx="4" />
      </g>
      <g fill="currentColor" opacity="0.8">
        <rect x="12" y="12" width="10" height="10" rx="2" />
        <rect x="78" y="12" width="10" height="10" rx="2" />
        <rect x="12" y="78" width="10" height="10" rx="2" />
        <rect x="44" y="44" width="6" height="6" rx="1" />
        <rect x="54" y="54" width="6" height="6" rx="1" />
        <rect x="66" y="44" width="6" height="6" rx="1" />
        <rect x="76" y="58" width="6" height="6" rx="1" />
        <rect x="66" y="70" width="6" height="6" rx="1" />
      </g>
      <rect x="78" y="78" width="10" height="10" rx="2" fill="#DBFC74" stroke="#1A1A1A" strokeWidth="1.2" />
    </svg>
  );
}
