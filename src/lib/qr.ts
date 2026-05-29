// Thin wrapper around qr-code-styling. The library is a browser-only DOM
// renderer, so this module must be imported in client components only.

import type { Options as QrOptions } from "qr-code-styling";

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

/**
 * Lazy-load qr-code-styling and create an instance — must run in the browser.
 */
export async function createQr(style: QrStyle) {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  return new QRCodeStyling(buildQrOptions(style));
}
