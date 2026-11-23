import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { focusRing } from "@/components/site/section";

/**
 * Primary button: ink circle with a white chevron, then the label on a
 * transparent background. On hover the circle nudges right and the pill
 * fills with stone. `filled` shows the stone pill by default (hover goes
 * to stone-dark).
 */
export function PrimaryButton({
  href,
  children,
  className = "",
  size = "md",
  filled = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
  filled?: boolean;
}) {
  const lg = size === "lg";
  return (
    <Link
      href={href}
      className={`group inline-flex shrink-0 items-center rounded-full font-body font-medium text-ink transition-colors duration-200 ${
        filled ? "bg-stone hover:bg-stone-dark" : "hover:bg-stone"
      } ${
        lg ? "h-12 gap-3 py-1.5 pl-1.5 pr-5 text-[17px]" : "h-10 gap-2.5 py-1.5 pl-1 pr-3 text-base"
      } ${focusRing} ${className}`}
    >
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full bg-ink text-white transition-transform duration-200 group-hover:translate-x-0.5 ${
          lg ? "h-9 w-9" : "h-8 w-8"
        }`}
      >
        <ChevronRight className={lg ? "h-[18px] w-[18px]" : "h-4 w-4"} strokeWidth={2.25} />
      </span>
      <span className="whitespace-nowrap">{children}</span>
    </Link>
  );
}

/** Secondary button: stone pill, ink label. */
export function SecondaryButton({
  href,
  children,
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const cls = `inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-stone px-6 font-body text-base font-medium text-ink transition-colors duration-200 hover:bg-stone-dark md:h-[46px] ${focusRing} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Class string for secondary-styled <button>s (e.g. the Log in trigger). */
export const secondaryButtonClass = `inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-stone px-5 font-body text-base font-medium text-ink transition-colors duration-200 hover:bg-stone-dark ${focusRing}`;
