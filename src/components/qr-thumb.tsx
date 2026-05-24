/**
 * Small QR thumbnail — used in the dashboard right rail, the
 * /dashboard/qr-codes list, and anywhere else we need to show "the
 * user's actual QR" at small size.
 *
 * B5/Fix 19+24 — bulletproof refactor. The previous client-side
 * qr-code-styling implementation had three render-order hazards
 * (ref-mount race, async createQr cancellation, dynamic-import
 * failure) that all converged on the same visible symptom: the
 * thumbnail stuck on the skeleton state. This version drops the
 * client-rendering path entirely and uses an `<img>` pointed at the
 * existing server endpoint /api/qr/<id>/render.png — the same route
 * the welcome email uses, which renders via the `qrcode` npm package
 * (no DOM, no race). The browser handles caching, retry, and lazy
 * loading. There is no React state and no useEffect, so it cannot get
 * stuck in any loading state.
 *
 * Trade-off: we lose the per-QR dot_style / corner_style / gradient
 * subtleties at thumb size, since the server endpoint only honors
 * fg_color + bg_color. At 36–56 px those are imperceptible anyway,
 * and reliability matters more than visual fidelity here.
 */
export default function QrThumb({
  qrId,
  size = 56,
  className = "",
  bgColor = "#FFFFFF",
}: {
  /** qr_codes.id — the render route looks up the row and serves PNG. */
  qrId: string;
  /** Rendered display size in CSS px (square). Defaults to 56. */
  size?: number;
  /** Extra Tailwind classes for the wrapper. */
  className?: string;
  /** QR bg_color — shown behind the image so the transition from
   *  loading-blank to loaded-png isn't jarring on dark/colored QRs. */
  bgColor?: string;
}) {
  // Request 2× for retina, capped at the server's 1024 max + 128 min.
  const renderSize = Math.min(1024, Math.max(128, size * 2));
  const src = `/api/qr/${qrId}/render.png?size=${renderSize}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size, backgroundColor: bgColor }}
      className={`shrink-0 rounded-md object-contain ${className}`}
    />
  );
}
