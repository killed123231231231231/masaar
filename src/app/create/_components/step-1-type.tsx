"use client";

import {
  Globe, FileText, Image as ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet, QrCode, type LucideIcon,
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
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
          What do you want to create?
        </h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Pick a content type to get started.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_TYPES.map((c) => {
            const Icon = ICONS[c.icon] ?? QrCode;
            const active = selected === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect(c.key)}
                className={`relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-deep-teal bg-deep-teal/5 ring-1 ring-deep-teal/20"
                    : "border-charcoal/10 bg-white"
                }`}
              >
                {c.badge && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      c.badge === "Coming soon"
                        ? "bg-charcoal/10 text-charcoal/50"
                        : "bg-terracotta/15 text-terracotta-dark"
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-deep-teal/10 text-deep-teal">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 font-semibold text-charcoal">{c.label}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-charcoal/55">
                  {c.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 grid place-items-center rounded-2xl border border-charcoal/10 bg-sand-light/40 p-10 text-center">
          {SelIcon ? (
            <>
              <span className="grid h-24 w-24 place-items-center rounded-full bg-deep-teal/10 text-deep-teal">
                <SelIcon className="h-10 w-10" strokeWidth={1.5} />
              </span>
              <p className="mt-4 text-sm font-semibold text-charcoal">
                {CONTENT_TYPES.find((c) => c.key === selected)!.label}
              </p>
            </>
          ) : (
            <>
              <span className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-dashed border-charcoal/20 text-charcoal/25">
                <QrCode className="h-10 w-10" />
              </span>
              <p className="mt-4 text-sm text-charcoal/45">
                Pick a type to preview
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
