import Link from "next/link";
import { Check } from "lucide-react";
import LogoMark from "@/components/logo-mark";

const VALUE_PROPS = [
  "Edit destinations after printing — no reprint",
  "Real-time scan analytics, every scan",
  "Arabic-first, built for the GCC",
];

/**
 * Marketing rail shown beside the auth forms (login / signup).
 * Server component — pure markup, no client state.
 * The testimonial is an explicit, labelled placeholder: not a real
 * customer, person, or company.
 */
export default function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-deep-teal p-12 text-white lg:flex lg:flex-col lg:justify-center lg:gap-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-deep-teal-light/20 blur-3xl"
      />

      <Link href="/" className="relative flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5">
          <LogoMark className="h-full w-full" />
        </span>
        <span className="text-lg font-bold tracking-tight">
          Masaar <span className="font-arabic">مسار</span>
        </span>
      </Link>

      <div className="relative">
        <h2 className="text-balance font-display text-3xl font-bold leading-tight">
          Every scan has a path.
        </h2>
        <p className="mt-3 max-w-sm text-balance leading-relaxed text-white/75">
          Create, manage, and adapt dynamic QR codes — built for businesses
          across the Gulf.
        </p>

        <ul className="mt-8 space-y-4">
          {VALUE_PROPS.map((v) => (
            <li key={v} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-sm text-white/85">{v}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="relative rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
        <span className="inline-block rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
          Example
        </span>
        <blockquote className="mt-3 text-sm leading-relaxed text-white/85">
          “Placeholder quote — replace with a real customer story before
          launch. This space shows where social proof will live.”
        </blockquote>
        <figcaption className="mt-3 text-xs text-white/55">
          Sample attribution · not a real customer
        </figcaption>
      </figure>
    </aside>
  );
}
