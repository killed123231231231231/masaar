import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

// Shared presentational primitives for the signed-in product (2026-11
// Sunbeam-style redesign): paper page, white rounded-24 cards with a stone
// border, Urbanist headings, Jost body, ink + lime accents. Pure markup, no
// hooks, so both server and client components can use them.

export const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

/** White rounded-24 card with a stone border. */
export function Card({
  as: Tag = "section",
  className = "",
  children,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  as?: "section" | "div" | "aside" | "article";
  className?: string;
  children: ReactNode;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`min-w-0 rounded-card border border-stone-dark/70 bg-white shadow-card ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Card title row: Urbanist title, optional muted note / right slot. */
export function CardHeader({
  title,
  note,
  right,
  className = "",
  as: H = "h2",
}: {
  title: ReactNode;
  note?: ReactNode;
  right?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 ${className}`}>
      <div className="min-w-0">
        <H className="font-heading text-[17px] font-semibold leading-tight tracking-[-0.01em] text-ink">
          {title}
        </H>
        {note && <p className="mt-1 text-[13px] text-muted-3">{note}</p>}
      </div>
      {right}
    </div>
  );
}

/** Round icon well (stone by default, lime for highlights, ink on dark). */
export function IconWell({
  icon: Icon,
  tone = "stone",
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  tone?: "stone" | "lime" | "ink" | "lilac" | "sky" | "mint" | "blush";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const toneCls = {
    stone: "bg-stone text-ink",
    lime: "bg-lime text-ink",
    ink: "bg-ink text-lime",
    lilac: "bg-lilac/50 text-ink",
    sky: "bg-sky/50 text-ink",
    mint: "bg-mint/50 text-ink",
    blush: "bg-blush/60 text-ink",
  }[tone];
  const sizeCls = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const iconCls = { sm: "h-4 w-4", md: "h-[18px] w-[18px]", lg: "h-5 w-5" }[size];
  return (
    <span className={`grid shrink-0 place-items-center rounded-full ${toneCls} ${sizeCls} ${className}`}>
      <Icon className={iconCls} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

/**
 * Sunbeam primary button: ink circle with a white icon, then the ink label on
 * a transparent pill that turns stone on hover. `href` renders a Link.
 */
export function PrimaryButton({
  href,
  icon: Icon = ChevronRight,
  children,
  className = "",
  prefetch,
}: {
  href: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`group inline-flex h-10 items-center gap-2.5 rounded-full py-1.5 pl-1 pr-3.5 font-body text-[15px] font-medium text-ink transition-colors hover:bg-stone ${FOCUS} ${className}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white transition-transform duration-200 group-hover:translate-x-0.5">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      {children}
    </Link>
  );
}

/** Stone secondary pill (links and buttons share the look). */
export const SECONDARY_BTN = `inline-flex h-10 items-center justify-center gap-2 rounded-full bg-stone px-4 font-body text-sm font-medium text-ink transition-colors hover:bg-stone-dark disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`;

/** Solid ink pill — used for form submits where a circle button doesn't fit. */
export const INK_BTN = `inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 font-body text-sm font-medium text-white transition-colors hover:bg-ink-soft disabled:pointer-events-none disabled:opacity-60 ${FOCUS}`;

/** White outlined pill (header controls such as Export / selects). */
export const OUTLINE_BTN = `inline-flex h-10 items-center justify-center gap-2 rounded-full border border-stone-dark bg-white px-4 font-body text-sm font-medium text-ink transition-colors hover:bg-cream disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`;

/** Text input in the new system. */
export const INPUT =
  "w-full rounded-2xl border border-stone-dark bg-white px-4 py-2.5 font-body text-sm text-ink placeholder:text-muted-4 outline-none transition-colors focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

/** Page heading block used on every dashboard surface. */
export function PageTitle({
  title,
  sub,
  eyebrow,
  right,
}: {
  title: ReactNode;
  sub?: ReactNode;
  eyebrow?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="font-heading text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[34px]">
          {title}
        </h1>
        {sub && <p className="mt-1.5 max-w-2xl font-body text-[15px] text-muted-2">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/** Honest empty state: icon well, title, one line, optional action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <IconWell icon={icon} tone="lime" size="lg" />
      <p className="mt-4 font-heading text-lg font-semibold text-ink">{title}</p>
      {body && <p className="mt-1.5 max-w-sm font-body text-sm leading-relaxed text-muted-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Small skeleton block in the new palette (loading.tsx files). */
export function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-stone ${className}`} />;
}
