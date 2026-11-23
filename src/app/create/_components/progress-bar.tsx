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
  /** Furthest step the user has validly reached; completed steps stay
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
      <nav aria-label="Builder steps" className="px-3 py-3 sm:px-6 sm:py-4 md:px-8">
        {/* Mobile: three compact pills spread with justify-between.
            sm+: a 1fr/auto/1fr grid so step 1 hugs the left edge, step 3
            the right edge and step 2 sits exactly centred, with the
            connector lines growing to fill both gaps. */}
        <ol className="flex items-center justify-between gap-1.5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-0">
          {STEPS.map((s, i) => {
            const active = s.n === current;
            const done = !active && s.n <= maxStep;
            const clickable = s.n <= maxStep;
            const isFirst = i === 0;
            const isLast = i === STEPS.length - 1;
            const connector = (filled: boolean) => (
              <span
                aria-hidden
                className={`hidden h-px min-w-4 flex-1 sm:mx-3 sm:block md:mx-5 ${
                  filled ? "bg-ink/40" : "bg-stone-dark"
                }`}
              />
            );
            return (
              <li
                key={s.n}
                className={`flex min-w-0 items-center ${isLast ? "sm:justify-end" : ""}`}
              >
                {/* Line between steps 2 and 3 lives in step 3's cell. */}
                {isLast && connector(STEPS[i - 1].n < maxStep)}
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onJump(s.n)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 font-body text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 sm:shrink-0 sm:pr-4 ${
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
                          : "bg-stone text-muted-2"
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
                {/* Line between steps 1 and 2 lives in step 1's cell. */}
                {isFirst && connector(s.n < maxStep)}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
