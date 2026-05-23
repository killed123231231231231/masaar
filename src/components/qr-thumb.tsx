"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode as QrCodeIcon } from "lucide-react";
import { createQr, type QrStyle } from "@/lib/qr";

/**
 * Small QR thumbnail — used in the dashboard right rail and the
 * /dashboard/qr-codes list so each row shows the user's REAL code with
 * their customizations (color, dot style, corners). Browser-only
 * renderer (qr-code-styling).
 *
 * Skeleton placeholder while loading (so an empty/whitespace `data` —
 * which happens during SSR / first paint before `origin` is read on
 * the client — doesn't dump a half-rendered QR into the DOM). Logo is
 * deliberately skipped at thumbnail size: it competes too much with
 * the data area at <80px and slows the render path.
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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    // Bail on missing / placeholder data. `data === " "` is our
    // intentional whitespace placeholder for empty destinations;
    // /r/... is the relative-URL form that means origin hasn't
    // resolved yet on the client.
    const data = style.data?.trim() ?? "";
    if (!data || data === " " || data.startsWith("/r/")) {
      setStatus("loading");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const qr = await createQr({
          ...style,
          width: size,
          height: size,
          // Skip the logo at thumb size — keep the QR readable.
          logoUrl: null,
          logoDataUrl: null,
          // "M" gives more dot real estate than "H" at small sizes;
          // we're not embedding a logo, so the higher EC level isn't
          // earning its keep.
          errorLevel: "M",
        });
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        qr.append(ref.current);
        if (!cancelled) setStatus("ready");
      } catch (e) {
        console.warn("[QrThumb] render failed:", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    style.data,
    style.fgColor,
    style.bgColor,
    style.gradientColor,
    style.dotStyle,
    style.cornerStyle,
    size,
  ]);

  // Skeleton while we wait for origin / async createQr. Static QRs
  // skip this branch immediately because their data resolves on first
  // render. Dynamic QRs briefly flash this before the SVG drops in.
  if (status === "loading") {
    return (
      <div
        aria-hidden
        className={`grid shrink-0 animate-pulse place-items-center rounded-md bg-sand-light/70 ${className}`}
        style={{ width: size, height: size }}
      >
        <QrCodeIcon
          className="text-charcoal/25"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-md bg-sand-light text-charcoal/40 ${className}`}
        style={{ width: size, height: size }}
        title="Couldn’t render preview"
      >
        <QrCodeIcon
          className="text-charcoal/35"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className={`shrink-0 overflow-hidden rounded-md ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
