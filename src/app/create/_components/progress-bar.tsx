"use client";

import { Check, LayoutGrid, PencilLine, SlidersHorizontal } from "lucide-react";

const STEPS = [
  { n: 1 as const, label: "Choose QR type", short: "Type", Icon: LayoutGrid },
  { n: 2 as const, label: "Complete Content", short: "Content", Icon: PencilLine },
  { n: 3 as const, label: "Customize & Protect", short: "Design", Icon: SlidersHorizontal },
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
    <div className="shrink-0 border-b border-stone-dark bg-white">
      {/* Contained-shell stepper: step pills inside the wizard card (the
          card's middle scrolls, not the page). Active = ink pill, done =
          lime check, upcoming = stone. Clickable in both directions up to
          maxStep so a back-jump never locks forward navigation. */}
      <nav aria-label="Builder steps" className="px-3 py-3 sm:px-6 sm:py-4">
        <ol className="flex items-center justify-between gap-1.5 sm:justify-center sm:gap-3">
          {STEPS.map((s, i) => {
            const active = s.n === current;
            const done = !active && s.n <= maxStep;
            const clickable = s.n <= maxStep;
            return (
              <li key={s.n} className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onJump(s.n)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 font-body text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 sm:pr-4 ${
                    active
                      ? "bg-ink text-white"
                      : done
                        ? "bg-stone text-ink hover:bg-stone-dark"
                        : "bg-transparent text-muted-3"
                  } ${clickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      active
                        ? "bg-white/15 text-white"
                        : done
                          ? "bg-lime text-ink"
                          : "bg-stone text-muted-3"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <s.Icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="truncate font-medium">
                    <span className="sr-only">Step {s.n}: </span>
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={`hidden h-px w-6 shrink-0 sm:block md:w-10 ${
                      s.n < maxStep ? "bg-ink/40" : "bg-stone-dark"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
