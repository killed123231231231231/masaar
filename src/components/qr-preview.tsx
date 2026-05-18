"use client";

import { useEffect, useRef } from "react";
import { createQr, type QrStyle } from "@/lib/qr";

export default function QrPreview({ style }: { style: QrStyle }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<Awaited<ReturnType<typeof createQr>> | null>(null);

  // Mount once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qr = await createQr(style);
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      qr.append(ref.current);
      qrRef.current = qr;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update when style changes
  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.update({
      data: style.data,
      image: style.logoUrl || style.logoDataUrl || undefined,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
        imageSize: 0.3,
        hideBackgroundDots: true,
      },
      dotsOptions: {
        type: (style.dotStyle as "square") ?? "square",
        ...(style.gradientColor
          ? {
              gradient: {
                type: "linear",
                rotation: 0,
                colorStops: [
                  { offset: 0, color: style.fgColor },
                  { offset: 1, color: style.gradientColor },
                ],
              },
            }
          : { color: style.fgColor }),
      },
      backgroundOptions: { color: style.bgColor },
      cornersSquareOptions: {
        type: (style.cornerStyle as "square") ?? "square",
        color: style.fgColor,
      },
      cornersDotOptions: { type: "square", color: style.fgColor },
    });
  }, [style]);

  async function download(ext: "png" | "svg" | "jpeg") {
    if (!qrRef.current) return;
    await qrRef.current.download({ name: "masaar-qr", extension: ext });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="qr-live rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      />
      <div className="flex gap-2">
        <DownloadBtn onClick={() => download("png")}>PNG</DownloadBtn>
        <DownloadBtn onClick={() => download("svg")}>SVG</DownloadBtn>
        <DownloadBtn onClick={() => download("jpeg")}>JPG</DownloadBtn>
      </div>
    </div>
  );
}

function DownloadBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
