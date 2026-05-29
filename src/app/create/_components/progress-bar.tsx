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
    <div className="shrink-0 border-b border-[#E5E7EB] bg-white">
      {/* Contained-shell stepper (getqr): a fixed ~88px header inside
          the wizard card (no page-sticky — the card's middle scrolls,
          not the page). max-w + justify-between → Step 1 left, Step 2
          centered, Step 3 right. */}
      <div className="mx-auto flex h-[88px] w-full max-w-[1140px] items-center justify-between px-8">
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
                        : "bg-charcoal/[0.07] text-charcoal/50"
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
                        : "font-medium text-charcoal/55"
                  }`}
                >
                  {/* Sentence case per mockup ("Step 1", not "STEP 1"). */}
                  <span className="text-xs tracking-wide text-charcoal/45">
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
