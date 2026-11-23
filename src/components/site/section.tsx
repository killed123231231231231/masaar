import type { ReactNode } from "react";
import Reveal from "@/components/motion/reveal";

/**
 * Layout primitives for the public marketing surface (Sunbeam-style
 * redesign). Content width is ~1170px: max-w 1218px minus 24px gutters
 * on desktop, 16px gutters on phones.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1218px] px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

/** H2: Urbanist 54/64.8 weight 500 on desktop, 36px on phones. */
export function SectionTitle({
  children,
  align = "center",
  className = "",
  id,
}: {
  children: ReactNode;
  align?: "center" | "left";
  className?: string;
  id?: string;
}) {
  return (
    <Reveal>
      <h2
        id={id}
        className={`font-heading text-[36px] font-medium leading-[1.15] tracking-[-0.02em] text-ink md:text-[54px] md:leading-[1.2] ${
          align === "center" ? "mx-auto text-center" : "text-left"
        } text-balance ${className}`}
      >
        {children}
      </h2>
    </Reveal>
  );
}

/** Shared focus ring for links and buttons on the marketing surface. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
