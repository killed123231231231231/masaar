// Thin wrapper around qr-code-styling. The library is a browser-only DOM
// renderer, so this module must be imported in client components only.

import type { Options as QrOptions } from "qr-code-styling";
import { pickPaletteColor } from "@/lib/palette";

export interface QrStyle {
  data: string;
  width?: number;
  height?: number;
  fgColor: string;
  bgColor: string;
  gradientColor?: string | null;
  dotStyle?: string;       // square | dots | rounded | classy | classy-rounded | extra-rounded
  cornerStyle?: string;    // square | dot | extra-rounded
  logoDataUrl?: string | null;
  logoUrl?: string | null;   // public URL (Supabase storage) — preferred
  imageSize?: number;        // logo scale, fraction of QR (qr-code-styling), ~0.1–0.45
  errorLevel?: "L" | "M" | "Q" | "H";
  /** 2–4 solid colors: each data dot gets one, deterministically scattered.
   *  Takes precedence over gradientColor for the dots. */
  dotPalette?: string[] | null;
  /** Exactly 3 colors for the finder squares: [top-left, top-right,
   *  bottom-left]. null → all corners follow fgColor as before. */
  cornerColors?: string[] | null;
}

export function buildQrOptions(s: QrStyle): QrOptions {
  const useGradient = !!s.gradientColor;

  return {
    width: s.width ?? 320,
    height: s.height ?? 320,
    type: "svg",
    data: s.data,
    image: s.logoUrl || s.logoDataUrl || undefined,
    margin: 8,
    qrOptions: {
      errorCorrectionLevel: s.errorLevel ?? "H",
    },
    dotsOptions: {
      type: (s.dotStyle as NonNullable<QrOptions["dotsOptions"]>["type"]) ?? "square",
      ...(useGradient
        ? {
            gradient: {
              type: "linear",
              rotation: 0,
              colorStops: [
                { offset: 0, color: s.fgColor },
                { offset: 1, color: s.gradientColor! },
              ],
            },
          }
        : { color: s.fgColor }),
    },
    backgroundOptions: { color: s.bgColor },
    cornersSquareOptions: {
      type: (s.cornerStyle as NonNullable<QrOptions["cornersSquareOptions"]>["type"]) ?? "square",
      color: s.fgColor,
    },
    cornersDotOptions: {
      type: "square",
      color: s.fgColor,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: s.imageSize ?? 0.3,
      margin: 4,
      crossOrigin: "anonymous",
    },
  };
}

/* ────────────── multi-color dots + per-corner colors ──────────────
 * qr-code-styling paints all data dots as ONE rect clipped by a clipPath
 * of dot shapes (that's how its gradients work), and each finder corner
 * as its own clipPath + fill rect. We hook the library's official
 * applyExtension() — it re-runs after EVERY draw (mount + update) and is
 * included in download()/getRawData() serialization — and restyle:
 *  - dotPalette: hide the single paint rect, clone each dot shape out of
 *    the clipPath with a deterministic per-index palette fill.
 *  - cornerColors: retarget each corner's fill rects. Corner clipPath ids
 *    carry the corner position: 0-0 top-left, 1-0 top-right, 0-1
 *    bottom-left (verified against qr-code-styling 1.9.2).
 */

export interface QrExtras {
  dotPalette: string[] | null;
  cornerColors: string[] | null;
}

type QrWithExtras = { __masaarExtras?: { current: QrExtras } };

const CORNER_POS = ["0-0", "1-0", "0-1"] as const;

function applyMasaarSvgStyle(svg: SVGElement, extras: QrExtras): void {
  // Idempotency within one draw cycle (applyExtension itself triggers an
  // update on registration): drop clones from any previous pass first.
  svg.querySelectorAll("[data-masaar-dot]").forEach((n) => n.remove());

  // Multi-color dots. The selector must anchor on "#clip-path-dot-color"
  // (with the #) — the corners' "clip-path-corners-dot-color" ids would
  // otherwise substring-match.
  const paintRect = svg.querySelector<SVGRectElement>(
    'rect[clip-path*="#clip-path-dot-color"]'
  );
  const dotClip = svg.querySelector<SVGClipPathElement>(
    'clipPath[id^="clip-path-dot-color"]'
  );
  const palette =
    extras.dotPalette && extras.dotPalette.length >= 2 ? extras.dotPalette : null;
  if (palette && paintRect && dotClip) {
    paintRect.setAttribute("display", "none");
    Array.from(dotClip.children).forEach((shape, i) => {
      const clone = shape.cloneNode(true) as SVGElement;
      clone.setAttribute("fill", pickPaletteColor(palette, i));
      clone.setAttribute("data-masaar-dot", "1");
      svg.appendChild(clone);
    });
  } else if (paintRect) {
    paintRect.removeAttribute("display");
  }

  // Per-corner colors — both the outer square and the inner dot of each
  // finder get the corner's color, so the corner reads as one unit.
  const corners =
    extras.cornerColors && extras.cornerColors.length === 3
      ? extras.cornerColors
      : null;
  if (corners) {
    CORNER_POS.forEach((pos, i) => {
      for (const part of ["corners-square-color", "corners-dot-color"]) {
        const rect = svg.querySelector<SVGRectElement>(
          `rect[clip-path*="${part}-${pos}"]`
        );
        rect?.setAttribute("fill", corners[i]);
      }
    });
  }
}

/** Point an existing instance's extras at new values (used by live previews
 *  that call qr.update() instead of recreating) — the extension re-reads
 *  this slot after every draw. */
export function setQrExtras(qr: unknown, extras: Partial<QrExtras>): void {
  const slot = (qr as QrWithExtras).__masaarExtras;
  if (slot) {
    slot.current = {
      dotPalette: extras.dotPalette ?? null,
      cornerColors: extras.cornerColors ?? null,
    };
  }
}

/**
 * Lazy-load qr-code-styling and create an instance — must run in the browser.
 */
export async function createQr(style: QrStyle) {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const qr = new QRCodeStyling(buildQrOptions(style));
  // Mutable extras slot + always-on extension: registering unconditionally
  // means a later setQrExtras + update() can turn the features on/off
  // without recreating the instance.
  const slot: { current: QrExtras } = {
    current: {
      dotPalette: style.dotPalette ?? null,
      cornerColors: style.cornerColors ?? null,
    },
  };
  (qr as unknown as QrWithExtras).__masaarExtras = slot;
  qr.applyExtension((svg) =>
    applyMasaarSvgStyle(svg as unknown as SVGElement, slot.current)
  );
  return qr;
}
