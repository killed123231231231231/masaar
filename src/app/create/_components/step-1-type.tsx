"use client";

import { useEffect, useRef } from "react";
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
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* LEFT — header + "Most used" caption + card grid (getqr layout). */}
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
                /* getqr card: white tile, light neutral border + soft
                   shadow, lifts on hover; selected = brand border + tint
                   + ring. Centered icon-chip / title / description. */
                className={`group relative rounded-2xl border bg-white px-5 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-deep-teal bg-deep-teal/[0.04] ring-1 ring-deep-teal"
                    : "border-charcoal/10 hover:border-deep-teal/40"
                }`}
              >
                {c.badge && (
                  <span
                    /* getqr places the pill in the card's top-right
                       corner (not straddling the top border). */
                    className={`absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      c.badge === "Coming soon"
                        ? "bg-charcoal/10 text-charcoal/55"
                        : "bg-deep-teal text-white"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-deep-teal/10 text-deep-teal transition-colors group-hover:bg-deep-teal/15">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-charcoal">
                  {c.label}
                </h3>
                <p className="mt-1 text-[13px] leading-snug text-charcoal/55">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — sticky preview, separated from the grid by a single thin
          vertical divider line (the getqr look the user called out). */}
      <aside className="hidden lg:block lg:border-l lg:border-charcoal/10 lg:pl-8 lg:pt-12">
        <div className="sticky top-28">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-deep-teal/[0.06] p-8">
            <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-deep-teal/15 text-deep-teal">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="grid h-full w-full place-items-center">
              {selMeta ? <Step1LiveQr /> : <DashedQrPlaceholder />}
            </div>
          </div>
          {/* Heading + subcopy sit BELOW the panel, matching getqr. */}
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

/* Live brand QR preview shown once a type is selected — a real
   qr-code-styling render of a placeholder, on a white card, so the panel
   "comes to life" exactly like getqr's. Data is a brand placeholder; the
   real destination is encoded after Step 2. */
function Step1LiveQr() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { createQr } = await import("@/lib/qr");
      const qr = await createQr({
        data: "https://masaar.sa",
        width: 200,
        height: 200,
        fgColor: "#0F5B55",
        bgColor: "#ffffff",
        dotStyle: "rounded",
        cornerStyle: "extra-rounded",
      });
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      qr.append(ref.current);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div
        ref={ref}
        aria-hidden
        className="grid place-items-center [&>svg]:h-36 [&>svg]:w-36"
      />
    </div>
  );
}

/* A decorative QR-shaped placeholder — 3 dashed finder-pattern
   corners + a few solid alignment dots, in the brand teal at low
   alpha. Mirrors getqr's right-panel illustration (empty state). */
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
