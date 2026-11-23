"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * One FAQ card. On phones the answer folds away behind the question (tap to
 * open) so the section isn't a long wall of text; from md up every answer is
 * always shown, as in the masonry design.
 */
export default function FaqCard({ q, children }: { q: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className="relative overflow-hidden rounded-card border border-stone-dark bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-card md:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-1 -top-6 hidden select-none font-heading text-[128px] font-semibold leading-none text-ink/[0.04] md:block"
      >
        ?
      </span>
      <h3 className="relative font-heading text-lg font-medium leading-[1.3] text-ink">
        {/* Phones: the question is the toggle. md+: plain heading. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-start justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 md:hidden"
        >
          <span>{q}</span>
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-muted-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <span className="hidden pr-8 md:block">{q}</span>
      </h3>
      <div id={id} className={`relative mt-3 font-body text-base leading-[1.45] text-muted-2 ${open ? "block" : "hidden"} md:block`}>
        {children}
      </div>
    </article>
  );
}
