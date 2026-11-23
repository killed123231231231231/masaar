import type { CSSProperties, ReactNode } from "react";

/**
 * Faceless, soft "3D" shapes for the marketing surface. Pure CSS/SVG, no
 * images. Volume comes from a white highlight + ink shade layered over a
 * palette token, an inset rim light and a soft drop shadow; `.grain`
 * adds film grain. All shapes are decorative (aria-hidden).
 */

const shade = (base: string) =>
  [
    "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 46%)",
    "radial-gradient(circle at 78% 84%, rgba(26,26,26,0.16) 0%, rgba(26,26,26,0) 58%)",
    base,
  ].join(", ");

const volume =
  "inset -6px -10px 22px rgba(26,26,26,0.10), inset 6px 8px 18px rgba(255,255,255,0.6), 0 28px 44px -22px rgba(26,26,26,0.35)";

/** Bobbing wrapper: `animate-float-y` with its own speed, delay and base rotation. */
export function Float({
  children,
  className = "",
  rotate = "0deg",
  duration = "6s",
  delay = "0s",
}: {
  children: ReactNode;
  className?: string;
  rotate?: string;
  duration?: string;
  delay?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute animate-float-y will-change-transform ${className}`}
      style={
        {
          "--r": rotate,
          animationDuration: duration,
          animationDelay: delay,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/** Lime scalloped seal (12 lobes) with grain, drawn in SVG. */
export function Seal({ id, className = "" }: { id: string; className?: string }) {
  const lobes = 12;
  const R = 37;
  const r = 13.5;
  const circles = Array.from({ length: lobes }, (_, i) => {
    const a = (i / lobes) * Math.PI * 2;
    return { cx: 50 + R * Math.cos(a), cy: 50 + R * Math.sin(a) };
  });
  const shapeEls = (
    <>
      <circle cx="50" cy="50" r={R} />
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx.toFixed(2)} cy={c.cy.toFixed(2)} r={r} />
      ))}
    </>
  );
  return (
    <svg viewBox="0 0 100 100" className={`overflow-visible ${className}`} aria-hidden>
      <defs>
        <radialGradient id={`${id}-fill`} cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#DBFC74" />
          <stop offset="100%" stopColor="#B9E23A" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>{shapeEls}</clipPath>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0.55 0" />
        </filter>
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#1A1A1A" floodOpacity="0.18" />
        </filter>
        <radialGradient id={`${id}-rim`} cx="70%" cy="78%" r="60%">
          <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <g fill={`url(#${id}-fill)`}>{shapeEls}</g>
      </g>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="100" height="100" fill={`url(#${id}-rim)`} />
        <rect width="100" height="100" filter={`url(#${id}-grain)`} opacity="0.22" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/** Lilac rounded-square QR "finder" ring: outer ring, hollow, solid centre. */
export function FinderRing({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`grain relative rounded-[30%] ${className}`}
      style={{ background: shade("#E3B8FF"), boxShadow: volume }}
    >
      <div
        className="absolute inset-[19%] z-[1] rounded-[24%] bg-paper"
        style={{ boxShadow: "inset 4px 6px 12px rgba(26,26,26,0.12), inset -2px -3px 8px rgba(255,255,255,0.8)" }}
      />
      <div
        className="absolute inset-[34%] z-[2] rounded-[26%]"
        style={{ background: shade("#E3B8FF"), boxShadow: "0 8px 14px -8px rgba(26,26,26,0.35), inset 2px 3px 6px rgba(255,255,255,0.6)" }}
      />
    </div>
  );
}

/** Sky quarter-disc. */
export function QuarterDisc({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`grain rounded-tl-full ${className}`}
      style={{ background: shade("#A9CCFF"), boxShadow: volume }}
    />
  );
}

/** Mint diamond (rounded square; rotate it through the Float wrapper). */
export function Diamond({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`grain rounded-[26%] ${className}`}
      style={{ background: shade("#8EF0B9"), boxShadow: volume }}
    />
  );
}

/** Small glowing sky dot. */
export function GlowDot({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-full ${className}`}
      style={{
        background: shade("#A9CCFF"),
        boxShadow: "0 0 24px 6px rgba(169,204,255,0.75), inset 2px 3px 6px rgba(255,255,255,0.7)",
      }}
    />
  );
}

/** Lilac pill/capsule. */
export function Capsule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`grain rounded-full ${className}`}
      style={{ background: shade("#FFC2E2"), boxShadow: volume }}
    />
  );
}

/** Soft white cloud built from blurred radial blobs (frame + footer backdrop). */
export function Cloud({ className = "", opacity = 0.9 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute blur-2xl ${className}`}
      style={{
        opacity,
        background: [
          "radial-gradient(closest-side at 30% 60%, rgba(255,255,255,0.95), rgba(255,255,255,0))",
          "radial-gradient(closest-side at 55% 40%, rgba(255,255,255,0.9), rgba(255,255,255,0))",
          "radial-gradient(closest-side at 78% 62%, rgba(255,255,255,0.85), rgba(255,255,255,0))",
        ].join(", "),
      }}
    />
  );
}
