import Link from "next/link";
import { BarChart3, Palette, PencilLine } from "lucide-react";
import LogoMark from "@/components/logo-mark";

const VALUE_PROPS = [
  { Icon: PencilLine, text: "Edit destinations after printing, no reprint" },
  { Icon: BarChart3, text: "See scans by day, city and device" },
  { Icon: Palette, text: "Colours, logo, rounded dots and frames" },
];

/**
 * Marketing rail shown beside the auth forms (signup).
 * Server component — pure markup, no client state. Sunbeam-style pastel
 * grain panel with faceless floating shapes. No testimonials: we only
 * show what the product actually does.
 */
export default function AuthAside() {
  return (
    <aside className="hidden p-3 lg:block">
      <div className="grain relative flex h-full flex-col justify-center gap-12 overflow-hidden rounded-panel bg-lilac p-12 font-body text-ink">
        {/* Faceless floating shapes (decorative). */}
        <span
          aria-hidden
          className="animate-float-y pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,#F4FFD0,#DBFC74_55%,#B9E23A)] shadow-float"
          style={{ ["--r" as string]: "12deg", animationDuration: "7s" }}
        />
        <span
          aria-hidden
          className="animate-float-y pointer-events-none absolute -bottom-8 left-10 h-28 w-28 rounded-[32px] bg-[radial-gradient(circle_at_30%_30%,#E4F0FF,#A9CCFF_60%,#86B4F5)] shadow-float"
          style={{ ["--r" as string]: "-14deg", animationDuration: "6s", animationDelay: "-2s" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-white/35 blur-3xl"
        />

        <Link
          href="/"
          className="relative flex w-fit items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <LogoMark className="h-9 w-9" />
          <span className="font-heading text-[26px] font-extrabold tracking-[-0.03em] text-ink">
            Vertexa QR
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance font-heading text-[42px] font-medium leading-[1.2] tracking-[-0.02em]">
            QR codes you can change anytime.
          </h2>
          <p className="mt-4 text-balance text-[17px] leading-relaxed text-ink/80">
            Create dynamic QR codes, edit them after printing, and see every
            scan.
          </p>

          <ul className="mt-8 space-y-2.5">
            {VALUE_PROPS.map(({ Icon, text }) => (
              <li
                key={text}
                className="flex w-fit items-center gap-3 rounded-full bg-white py-2 pl-2 pr-4 shadow-card"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-ink">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
