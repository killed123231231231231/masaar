"use client";

import { Check, LayoutGrid, PencilLine, SlidersHorizontal, ChevronRight } from "lucide-react";

const STEPS = [
  { n: 1 as const, label: "Choose QR type", Icon: LayoutGrid },
  { n: 2 as const, label: "Complete Content", Icon: PencilLine },
  { n: 3 as const, label: "Customize & Protect", Icon: SlidersHorizontal },
];

export default function ProgressBar({
  current,
  maxStep,
  onJump,
}: {
  current: 1 | 2 | 3;
  /** Furthest step the user has validly reached — completed steps stay
   *  clickable & checkmarked even after jumping back (Bug B). */
  maxStep: 1 | 2 | 3;
  onJump: (step: 1 | 2 | 3) => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-charcoal/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-4 sm:gap-4">
        {STEPS.map((s, i) => {
          const active = s.n === current;
          // Completed = reached before (≤ maxStep) and not the current
          // view. Clickable in BOTH directions up to maxStep so a
          // back-jump never locks forward navigation.
          const done = !active && s.n <= maxStep;
          const clickable = s.n <= maxStep;
          return (
            <div key={s.n} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump(s.n)}
                className={`flex items-center gap-2 ${
                  clickable ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors ${
                    active
                      ? "bg-deep-teal text-white"
                      : done
                        ? "bg-deep-teal/15 text-deep-teal"
                        : "bg-charcoal/10 text-charcoal/40"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />}
                </span>
                <span
                  className={`hidden text-sm sm:block ${
                    active
                      ? "font-bold text-charcoal"
                      : done
                        ? "font-medium text-charcoal/70"
                        : "text-charcoal/40"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wide text-charcoal/40">
                    Step {s.n}
                  </span>
                  <br />
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-charcoal/25" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
