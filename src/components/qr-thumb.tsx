"use client";

import { useEffect, useRef } from "react";
import { createQr, type QrStyle } from "@/lib/qr";

/**
 * Small QR thumbnail — used in the dashboard right rail and the
 * /dashboard/qr-codes grid so each card shows the user's REAL code with
 * their customizations (color, dot style, corners, logo), not a generic
 * lucide placeholder.
 *
 * Browser-only renderer (qr-code-styling DOM). Renders client-side
 * deferred via useEffect — server doesn't ship the SVG. For dashboards
 * with 50+ QRs this would matter; at our scale it's fine.
 */
export default function QrThumb({
  style,
  size = 56,
  className = "",
}: {
  style: QrStyle;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qr = await createQr({ ...style, width: size, height: size });
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      qr.append(ref.current);
    })();
    return () => {
      cancelled = true;
    };
    // Stringify style fields we care about so we re-render on any
    // user-visible change. The QR data + colors + shapes drive output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    style.data,
    style.fgColor,
    style.bgColor,
    style.gradientColor,
    style.dotStyle,
    style.cornerStyle,
    style.logoUrl,
    style.logoDataUrl,
    size,
  ]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`shrink-0 overflow-hidden rounded-md ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
