"use client";

import { useEffect, useRef, useState } from "react";
import { createQr } from "@/lib/qr";

export interface StyledQrProps {
  /** qr_codes.id — used for the render.png fallback `<img>`. */
  qrId: string;
  /** What the QR encodes (dynamic: /r/<shortId>; static: destination). */
  data: string;
  fgColor: string;
  bgColor: string;
  gradientColor?: string | null;
  dotStyle?: string;
  cornerStyle?: string;
  logoUrl?: string | null;
  imageSize?: number;
  /** Display size in CSS px (square). Also drives the internal render
   *  resolution. When `fill` is set this is only the resolution hint. */
  size?: number;
  /** Fill the parent box (h/w 100%) instead of a fixed inline size — lets a
   *  responsive wrapper control the displayed size. */
  fill?: boolean;
  className?: string;
}

/**
 * C2 — client-rendered, fully-styled QR thumbnail (dot-style, gradient,
 * logo, logo-scale) so the dashboard matches the live preview, unlike the
 * server render.png (square dots, solid color only).
 *
 * Reliability: an <img src=render.png> fallback renders INSTANTLY and only
 * hides once the qr-code-styling SVG has mounted. If the styled render
 * fails (dynamic-import / CORS / race), the fallback stays — so it can
 * never get stuck blank (the failure mode that retired the old client
 * thumbnail).
 */
export default function StyledQr({
  qrId,
  data,
  fgColor,
  bgColor,
  gradientColor,
  dotStyle,
  cornerStyle,
  logoUrl,
  imageSize,
  size = 56,
  fill = false,
  className = "",
}: StyledQrProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [styled, setStyled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStyled(false);
    (async () => {
      try {
        const renderSize = Math.max(160, size * 3);
        const qr = await createQr({
          data: data || " ",
          width: renderSize,
          height: renderSize,
          fgColor,
          bgColor,
          gradientColor,
          dotStyle,
          cornerStyle,
          logoUrl,
          imageSize,
        });
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        qr.append(ref.current);
        setStyled(true);
      } catch {
        /* keep the render.png fallback visible */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    data,
    fgColor,
    bgColor,
    gradientColor,
    dotStyle,
    cornerStyle,
    logoUrl,
    imageSize,
    size,
  ]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md ${fill ? "h-full w-full" : ""} ${className}`}
      style={
        fill
          ? { backgroundColor: bgColor }
          : { width: size, height: size, backgroundColor: bgColor }
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/qr/${qrId}/render.png?size=${Math.max(128, size * 2)}`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-contain ${styled ? "opacity-0" : ""}`}
      />
      <div
        ref={ref}
        aria-hidden
        className="relative h-full w-full [&>svg]:h-full [&>svg]:w-full"
      />
    </div>
  );
}
