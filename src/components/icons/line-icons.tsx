import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

// Custom line icons drawn in the lucide style (24 box, round caps,
// currentColor stroke) for QR types lucide has no good glyph for.
// Typed as LucideIcon so they drop into any icon map next to lucide icons.

function makeIcon(name: string, body: React.ReactNode): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function Icon(
    { size = 24, color = "currentColor", strokeWidth = 2, absoluteStrokeWidth, className, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={className}
        {...rest}
      >
        {body}
      </svg>
    );
  });
  Icon.displayName = name;
  return Icon as LucideIcon;
}

/** Messages / SMS: two overlapping speech bubbles, text lines in the front one. */
export const MessagesIcon = makeIcon(
  "MessagesIcon",
  <>
    <path d="M8 7V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2v3l-3-3" />
    <path d="M5 7h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-3 3v-3H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
    <path d="M6.5 10.5h3M6.5 13.5h6M6.5 16.5h6" strokeWidth={1.75} />
  </>,
);

/** Reviews / feedback: three stars over a thumbs-up. */
export const ReviewsIcon = makeIcon(
  "ReviewsIcon",
  <>
    <path strokeWidth={1.5} d="M4.60 3.10 L5.28 4.67 L6.98 4.83 L5.69 5.96 L6.07 7.62 L4.60 6.75 L3.13 7.62 L3.51 5.96 L2.22 4.83 L3.92 4.67Z" />
    <path strokeWidth={1.5} d="M12.00 1.00 L12.88 2.99 L15.04 3.21 L13.43 4.66 L13.88 6.79 L12.00 5.70 L10.12 6.79 L10.57 4.66 L8.96 3.21 L11.12 2.99Z" />
    <path strokeWidth={1.5} d="M19.40 3.10 L20.08 4.67 L21.78 4.83 L20.49 5.96 L20.87 7.62 L19.40 6.75 L17.93 7.62 L18.31 5.96 L17.02 4.83 L18.72 4.67Z" />
    <path d="M4 14h2.5v8H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
    <path d="M6.5 14.5 9.3 10.6a1.5 1.5 0 0 1 2.7.9V14h5.3a1.8 1.8 0 0 1 1.75 2.2l-1.15 4.4A1.8 1.8 0 0 1 16.2 22H6.5" />
  </>,
);
