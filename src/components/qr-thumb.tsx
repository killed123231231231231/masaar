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
 * B5/Fix 19 — the previous version conditionally returned three
 * different root divs (loading / error / ready) and only the "ready"
 * branch carried `ref={ref}`. Because the effect runs while status is
 * still "loading", `ref.current` was null when createQr resolved →
 * `if (!ref.current) return;` bailed before `setStatus("ready")` ever
 * fired → thumbs stayed in the skeleton forever. Now the ref-bearing
 * div is ALWAYS mounted; the skeleton and error fallbacks are absolute
 * overlays that React unmounts when status flips.
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

  return (
    <div
      aria-hidden
      className={`relative shrink-0 overflow-hidden rounded-md ${className}`}
      style={{ width: size, height: size }}
    >
      {/* QR canvas — ALWAYS mounted so the useEffect's ref.current is
          non-null by the time createQr's async promise resolves. */}
      <div ref={ref} className="absolute inset-0" />
      {/* Skeleton / error sits ON TOP, unmounted by React when status
          flips to "ready" (which only happens after qr.append succeeded,
          so the QR svg is already in the ref div underneath). */}
      {status !== "ready" && (
        <div
          className={`absolute inset-0 grid place-items-center rounded-md ${
            status === "loading"
              ? "animate-pulse bg-sand-light/70"
              : "bg-sand-light text-charcoal/40"
          }`}
          title={status === "error" ? "Couldn’t render preview" : undefined}
        >
          <QrCodeIcon
            className={status === "loading" ? "text-charcoal/25" : "text-charcoal/35"}
            style={{ width: size * 0.5, height: size * 0.5 }}
          />
        </div>
      )}
    </div>
  );
}
