import type { CSSProperties, ReactNode } from "react";

/**
 * Faceless, soft 3D clay shapes for the marketing surface, plus the Float
 * wrapper and Cloud backdrop. All decorative (aria-hidden).
 */

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

/**
 * The six clay shapes are real renders (generated in ChatGPT, transparent
 * WebP in public/shapes). Each keeps its old component name and className
 * sizing so callers don't change; object-contain keeps the art unstretched.
 */
function ShapeImg({ src, className = "" }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={`select-none object-contain drop-shadow-[0_22px_26px_rgba(26,26,26,0.16)] ${className}`}
    />
  );
}

/** Lime scalloped seal. `id` kept for API compatibility. */
export function Seal({ className = "" }: { id?: string; className?: string }) {
  return <ShapeImg src="/shapes/seal-lime.webp" className={className} />;
}

/** Lilac rounded-square QR finder ring. */
export function FinderRing({ className = "" }: { className?: string }) {
  return <ShapeImg src="/shapes/finder-lilac.webp" className={className} />;
}

/** Sky quarter-disc. */
export function QuarterDisc({ className = "" }: { className?: string }) {
  return <ShapeImg src="/shapes/quarter-sky.webp" className={className} />;
}

/** Mint diamond (the art is already a rhombus; don't rotate it 45deg). */
export function Diamond({ className = "" }: { className?: string }) {
  return <ShapeImg src="/shapes/diamond-mint.webp" className={className} />;
}

/** Small sky sphere. */
export function GlowDot({ className = "" }: { className?: string }) {
  return <ShapeImg src="/shapes/sphere-sky.webp" className={className} />;
}

/** Blush capsule (the art is already tilted; give it a squarish box). */
export function Capsule({ className = "" }: { className?: string }) {
  return <ShapeImg src="/shapes/pill-blush.webp" className={className} />;
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
