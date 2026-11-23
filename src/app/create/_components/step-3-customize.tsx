"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction,
} from "react";
import { AlertTriangle, ChevronDown, Download, Pizza } from "lucide-react";
import QrPreview from "@/components/qr-preview";
import FramedQr from "./framed-qr";
import { FRAMES } from "../_lib/frames";
import { LOGO_PRESETS } from "../_lib/logo-presets";
import { createClient } from "@/lib/supabase/client";
import {
  DOT_STYLES,
  CORNER_STYLES,
  type Customization,
} from "../_lib/types";
import {
  cleanHexArray,
  cleanPaletteOptions,
  DOT_PALETTE_MIN,
  DOT_PALETTE_MAX,
  CORNER_COUNT,
  type PaletteOptions,
} from "@/lib/palette";

function useDebounced<T>(v: T, ms: number): T {
  const [d, setD] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setD(v), ms);
    return () => clearTimeout(id);
  }, [v, ms]);
  return d;
}

export default function Step3Customize({
  previewData,
  shortId,
  isAuthed,
  draftToken,
  c,
  setC,
  showHeading = true,
  showPassword = true,
  showDownloads = true,
  downloadRef,
  previewFooter,
}: {
  previewData: string;
  shortId: string;
  isAuthed: boolean;
  /** B5/Fix 21 — wizard's stable draft token, scopes anon logo uploads. */
  draftToken: string;
  c: Customization;
  setC: Dispatch<SetStateAction<Customization>>;
  /** Hide the wizard heading when embedded elsewhere (e.g. the edit page). */
  showHeading?: boolean;
  /** Hide the password accordion (edit page persists password separately). */
  showPassword?: boolean;
  /** Hide the PNG/SVG/PDF buttons until the QR exists (create wizard gates
   *  these behind "Create QR"; the edit page shows them since the QR exists). */
  showDownloads?: boolean;
  /** Lets a parent (the wizard footer "Download" button) trigger the same
   *  framed export. The panel keeps this ref pointed at its current export fn. */
  downloadRef?: MutableRefObject<
    ((format: "png" | "svg") => Promise<void> | void) | null
  >;
  /** Optional node rendered inside the sticky preview card, directly below
   *  the QR + downloads (e.g. the edit page's "Save changes" button). */
  previewFooter?: ReactNode;
}) {
  // Stable across renders (functional update) so the memoised frame/logo
  // grids below don't re-render merely because a new `set` closure exists.
  const set = useCallback(
    function set<K extends keyof Customization>(k: K, v: Customization[K]) {
      setC((prev) => ({ ...prev, [k]: v }));
    },
    [setC]
  );

  const debounced = useDebounced(
    JSON.stringify({ previewData, ...c }),
    300
  );
  // Parse + build the preview inputs ONLY when the debounced snapshot
  // changes. Previously `JSON.parse` and the QrPreview style object were
  // rebuilt every render, so QrPreview's [style] effect — the expensive
  // qr-code-styling .update() — fired on every keystroke/colour-drag and
  // the 300ms debounce gated nothing. Memoising on `debounced` makes the
  // debounce real: the live QR re-renders at most once per ~300ms idle.
  const style = useMemo(
    () => JSON.parse(debounced) as { previewData: string } & Customization,
    [debounced]
  );
  const previewStyle = useMemo(
    () => ({
      data: style.previewData || " ",
      fgColor: style.fg_color,
      bgColor: style.bg_color,
      gradientColor: style.gradient_color,
      dotStyle: style.dot_style,
      cornerStyle: style.corner_style,
      logoUrl: style.logo_url,
      imageSize: style.logo_scale,
      // Gate through the SAME validator the server uses, so the preview (and
      // the DOM-snapshot download) only render palettes/corners that will
      // actually persist — an invalid free-typed hex reverts to single-color
      // here exactly as it does in the saved row. No more preview≠persisted.
      dotPalette: cleanHexArray(style.dot_palette, DOT_PALETTE_MIN, DOT_PALETTE_MAX),
      cornerColors: cleanHexArray(style.corner_colors, CORNER_COUNT, CORNER_COUNT),
      paletteOptions: cleanPaletteOptions(style.palette_options),
    }),
    [style]
  );

  // Framed download: composite the frame + QR (the previewRef subtree) to an
  // image with html-to-image. Works for the no-frame case too (just the QR).
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Export at ~2048px regardless of the small on-screen preview (~250px).
  // At a flat pixelRatio of 3 the PNG was only ~750px — too soft to print.
  // qr-code-styling embeds the logo at full source resolution (saveAsBlob
  // default), and the QR itself is vector, so a higher pixelRatio yields a
  // genuinely crisp export rather than an upscaled blur.
  const EXPORT_TARGET_PX = 2048;
  function exportPixelRatio(node: HTMLElement): number {
    const w = node.offsetWidth || 256;
    return Math.min(12, Math.max(3, Math.ceil(EXPORT_TARGET_PX / w)));
  }

  /** Exports must contain JUST the QR — not the on-screen preview card.
   *  Strips the card chrome (border / rounded corners / shadow) from the
   *  .qr-live wrapper for the duration of the snapshot and restores it
   *  after, so the screen keeps its card look while the downloaded file is
   *  a clean QR on plain white. The white padding is kept deliberately —
   *  that's the quiet zone scanners rely on. */
  async function withBareQrChrome<T>(
    node: HTMLElement,
    run: () => Promise<T>
  ): Promise<T> {
    const card = node.querySelector<HTMLElement>(".qr-live");
    const saved = card ? card.style.cssText : "";
    if (card) {
      card.style.cssText = `${saved}; border: none; border-radius: 0; box-shadow: none;`;
    }
    try {
      return await run();
    } finally {
      if (card) card.style.cssText = saved;
    }
  }

  async function downloadFramed(format: "png" | "svg") {
    const node = previewRef.current;
    if (!node) return;
    const lib = await import("html-to-image");
    const dataUrl = await withBareQrChrome(node, async () =>
      format === "png"
        ? lib.toPng(node, {
            pixelRatio: exportPixelRatio(node),
            cacheBust: true,
            backgroundColor: "#ffffff",
          })
        : lib.toSvg(node, { cacheBust: true })
    );
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `vertexa-qr.${format}`;
    a.click();
  }

  // Print-ready PDF (A4): the framed QR centered + a Vertexa QR footer. Done
  // client-side so it works before the QR is saved (no id needed).
  async function downloadPdf() {
    const node = previewRef.current;
    if (!node) return;
    const [{ toPng }, pdfLib] = await Promise.all([
      import("html-to-image"),
      import("pdf-lib"),
    ]);
    const { PDFDocument, rgb, StandardFonts } = pdfLib;
    const pngUrl = await withBareQrChrome(node, () =>
      toPng(node, {
        pixelRatio: exportPixelRatio(node),
        backgroundColor: "#ffffff",
        cacheBust: true,
      })
    );
    const pngBytes = await (await fetch(pngUrl)).arrayBuffer();
    const pdf = await PDFDocument.create();
    const A4 = { w: 595.28, h: 841.89 };
    const page = pdf.addPage([A4.w, A4.h]);
    const png = await pdf.embedPng(pngBytes);
    const w = 340;
    const h = (png.height / png.width) * w;
    page.drawImage(png, { x: (A4.w - w) / 2, y: (A4.h - h) / 2 + 30, width: w, height: h });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const footer = "Created with Vertexa QR · quickqrcode.live";
    const fs = 10;
    const tw = font.widthOfTextAtSize(footer, fs);
    page.drawText(footer, { x: (A4.w - tw) / 2, y: 64, size: fs, font, color: rgb(0.42, 0.42, 0.42) });
    const bytes = await pdf.save();
    const url = URL.createObjectURL(
      new Blob([bytes as unknown as BlobPart], { type: "application/pdf" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "vertexa-qr.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Keep the parent's download handle pointed at the current export fn so the
  // wizard footer's "Download" button produces the same framed PNG/SVG.
  useEffect(() => {
    if (downloadRef) downloadRef.current = (format) => downloadFramed(format);
     
  });

  // Memoised so a colour/dot/logo change elsewhere doesn't re-render all 16
  // frame thumbnails (the accordion-expand + drag freeze). Only frame-
  // related fields invalidate it.
  const framesGrid = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {/* 2-up on phones so each frame thumb stays a comfortable tap
            target; 3/4-up as width allows. */}
        {FRAMES.map((f) => {
          const active = c.frame_style === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => set("frame_style", f.key)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                active
                  ? "border-ink ring-1 ring-ink"
                  : "border-ink/10 hover:border-ink/40"
              }`}
            >
              <span className="flex h-[60px] w-full items-center justify-center overflow-hidden">
                <span className="origin-center scale-[0.4]">
                  <FramedQr
                    frame={f.key}
                    frameColor={c.frame_color}
                    textColor={c.text_color}
                    text={c.qr_text || "SCAN ME"}
                  >
                    <span className="block h-20 w-20 bg-ink" />
                  </FramedQr>
                </span>
              </span>
              <span className="text-center text-[10px] leading-tight text-muted-3">
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
    ),
    [c.frame_style, c.frame_color, c.text_color, c.qr_text, set]
  );

  // Memoised likewise — the 12 preset icons only depend on the current
  // selection, not on the colour/text edits happening above them.
  const logoPresets = useMemo(
    () => (
      <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {/* 4-up on phones (≥70px buttons) instead of 6-up (~50px taps). */}
        {LOGO_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => set("logo_url", p.url)}
            title={p.label}
            className={`grid aspect-square place-items-center overflow-hidden rounded-xl border p-1 transition ${
              c.logo_url === p.url
                ? "border-ink ring-1 ring-ink"
                : "border-ink/10 hover:border-ink/40"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.label} className="h-full w-full" />
          </button>
        ))}
      </div>
    ),
    [c.logo_url, set]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
      <div className="min-w-0">
        {showHeading && (
          <>
            <h1 className="font-heading text-[28px] font-medium leading-tight tracking-[-0.02em] text-ink md:text-[34px]">
              Customize &amp; protect
            </h1>
            <p className="mt-1.5 font-body text-[15px] text-muted-2">
              All optional. The defaults scan well.
            </p>
          </>
        )}

        <div className="mt-6 space-y-3">
          <Acc title="Frame around the QR code" defaultOpen={false}>
            {framesGrid}
            {c.frame_style !== "none" && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <ColorRow label="Frame color" value={c.frame_color} onChange={(v) => set("frame_color", v)} />
                <ColorRow label="Text color" value={c.text_color} onChange={(v) => set("text_color", v)} />
              </div>
            )}
          </Acc>

          <Acc title="Customization" defaultOpen>
            {isAuthed && <StylePresets c={c} setC={setC} />}
            <div className="grid grid-cols-2 gap-4">
              <ColorRow label="QR color" value={c.fg_color} onChange={(v) => set("fg_color", v)} />
              <ColorRow label="Background" value={c.bg_color} onChange={(v) => set("bg_color", v)} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={c.gradient_color !== null}
                onChange={(e) =>
                  // Gradient and multi-color are mutually exclusive — turning
                  // one on switches the other off.
                  setC((prev) => ({
                    ...prev,
                    gradient_color: e.target.checked ? prev.fg_color : null,
                    dot_palette: e.target.checked ? null : prev.dot_palette,
                  }))
                }
              />
              Gradient
            </label>
            {c.gradient_color !== null && (
              <div className="mt-2">
                <ColorRow label="Gradient end" value={c.gradient_color} onChange={(v) => set("gradient_color", v)} />
              </div>
            )}
            {/* Multi-color + per-corner colors persist only for authed users
                (anon create → create_anon_qr RPC drops them, same as frames /
                password). Gating avoids showing a preview the paid/claimed QR
                can't reproduce. `!!` (not `!== null`) so a pre-feature draft
                restored with these keys absent reads as OFF, not checked. */}
            {isAuthed && (
              <>
                <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={!!c.dot_palette}
                    onChange={(e) =>
                      setC((prev) => ({
                        ...prev,
                        dot_palette: e.target.checked
                          ? [prev.fg_color, "#E07A5F"]
                          : null,
                        gradient_color: e.target.checked ? null : prev.gradient_color,
                      }))
                    }
                  />
                  Multi-color dots (solid colors)
                </label>
                {c.dot_palette && (
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      {c.dot_palette.map((col, i) => (
                        <div key={i} className="relative">
                          <ColorRow
                            label={`Color ${i + 1}`}
                            value={col}
                            onChange={(v) => {
                              const next = [...c.dot_palette!];
                              next[i] = v;
                              set("dot_palette", next);
                            }}
                          />
                          <label className="mt-1 flex items-center gap-1.5 text-xs text-muted-3">
                            Weight
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={
                                c.palette_options?.weights?.length === c.dot_palette!.length
                                  ? c.palette_options.weights[i]
                                  : Math.round(100 / c.dot_palette!.length)
                              }
                              onChange={(e) => {
                                const n = c.dot_palette!.length;
                                const w =
                                  c.palette_options?.weights?.length === n
                                    ? [...c.palette_options.weights]
                                    : Array(n).fill(Math.round(100 / n));
                                w[i] = Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1)));
                                setC((prev) => ({
                                  ...prev,
                                  palette_options: cleanPaletteOptions({
                                    ...(prev.palette_options ?? {}),
                                    weights: w,
                                  }),
                                }));
                              }}
                              className="h-7 w-16 rounded border border-ink/15 px-1.5 text-xs"
                            />
                            %
                          </label>
                          {c.dot_palette!.length > 2 && (
                            <button
                              type="button"
                              aria-label={`Remove color ${i + 1}`}
                              onClick={() =>
                                setC((prev) => {
                                  const nextPal = prev.dot_palette!.filter((_, j) => j !== i);
                                  const w = prev.palette_options?.weights;
                                  return {
                                    ...prev,
                                    dot_palette: nextPal,
                                    palette_options:
                                      w && w.length === prev.dot_palette!.length
                                        ? cleanPaletteOptions({
                                            ...prev.palette_options,
                                            weights: w.filter((_, j) => j !== i),
                                          })
                                        : prev.palette_options,
                                  };
                                })
                              }
                              className="absolute right-0 top-0 text-xs text-muted-3 hover:text-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {c.dot_palette.length < 4 && (
                      <button
                        type="button"
                        onClick={() =>
                          setC((prev) => {
                            const w = prev.palette_options?.weights;
                            return {
                              ...prev,
                              dot_palette: [...prev.dot_palette!, "#0F5B55"],
                              palette_options:
                                w && w.length === prev.dot_palette!.length
                                  ? cleanPaletteOptions({
                                      ...prev.palette_options,
                                      weights: [...w, 10],
                                    })
                                  : prev.palette_options,
                            };
                          })
                        }
                        className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-medium text-muted hover:bg-stone"
                      >
                        + Add color (up to 4)
                      </button>
                    )}
                    <PaletteOptionsControls
                      value={c.palette_options}
                      fallbackAccent="#5B8C2A"
                      onChange={(po) => set("palette_options", po)}
                    />
                    <p className="text-xs text-muted-3">
                      Each color must be a 6-digit hex (e.g. #FFC107). Use the
                      swatch to be sure. Colors follow a fixed pattern, so your
                      download always matches the preview.
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <SelectRow label="QR shape" value={c.dot_style} options={DOT_STYLES} onChange={(v) => set("dot_style", v)} />
              <SelectRow label="Corner shape" value={c.corner_style} options={CORNER_STYLES} onChange={(v) => set("corner_style", v)} />
            </div>
            {isAuthed ? (
              <>
                <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={!!c.corner_colors}
                    onChange={(e) =>
                      set(
                        "corner_colors",
                        e.target.checked
                          ? [c.fg_color, c.fg_color, c.fg_color]
                          : null
                      )
                    }
                  />
                  Custom corner colors
                </label>
                {c.corner_colors && (
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {(["Top left", "Top right", "Bottom left"] as const).map(
                      (label, i) => (
                        <ColorRow
                          key={label}
                          label={label}
                          value={c.corner_colors![i]}
                          onChange={(v) => {
                            const next = [...c.corner_colors!];
                            next[i] = v;
                            set("corner_colors", next);
                          }}
                        />
                      )
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 rounded-xl bg-stone/60 p-2.5 text-xs text-muted-2">
                Multi-color dots &amp; custom corner colors are available once you
                have an account: create this QR, then style it from your
                dashboard.
              </p>
            )}
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-muted">QR text label</span>
              <input
                value={c.qr_text}
                onChange={(e) => set("qr_text", e.target.value)}
                placeholder="Scan me!"
                className="block min-h-[44px] w-full rounded-xl border border-stone-dark bg-white px-3.5 py-2 text-[15px] text-ink outline-none hover:border-ink/25 focus:border-ink focus:ring-2 focus:ring-ink/20"
              />
              <span className="mt-1 block text-xs text-muted-3">
                Shows under the QR for frames with a text region (Session I).
              </span>
            </label>
          </Acc>

          <Acc title="Logo" defaultOpen={false}>
            {previewData.startsWith("WIFI:") && c.logo_url && (
              <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-700">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />WiFi QR codes are small, so a logo can cover too much and make
                them <strong>unscannable</strong>. For WiFi we recommend removing
                the logo (or keeping it very small).
              </p>
            )}
            <p className="mb-2 text-sm font-medium text-muted">Quick icons</p>
            {logoPresets}
            <p className="mb-2 text-sm font-medium text-muted">Or upload your own</p>
            {/* B5/Fix 21 — anon users can upload too. LogoUpload branches
                internally based on isAuthed + draftToken. */}
            <LogoUpload
              shortId={shortId}
              isAuthed={isAuthed}
              draftToken={draftToken}
              value={c.logo_url}
              onChange={(v) => set("logo_url", v)}
            />
            {c.logo_url && (
              <label className="mt-4 block">
                <span className="mb-1 flex items-center justify-between text-sm font-medium text-muted">
                  <span>Logo size</span>
                  <span className="text-xs text-muted-3">
                    {Math.round(c.logo_scale * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={0.45}
                  step={0.01}
                  value={c.logo_scale}
                  onChange={(e) => set("logo_scale", Number(e.target.value))}
                  className="w-full accent-ink"
                />
                <span className="mt-1 block text-xs text-muted-3">
                  Bigger logos can make the QR harder to scan, so keep it readable.
                </span>
              </label>
            )}
          </Acc>

          {showPassword && (
          <Acc title="Protect this QR with a password" defaultOpen={false}>
            {isAuthed ? (
              <>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={!!c.password}
                    onChange={(e) => set("password", e.target.checked ? " " : "")}
                  />
                  Enable password protection
                </label>
                {!!c.password && (
                  <input
                    type="password"
                    value={c.password.trim()}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="4–64 characters"
                    className="mt-3 block min-h-[44px] w-full rounded-xl border border-stone-dark bg-white px-3.5 py-2 text-[15px] text-ink outline-none hover:border-ink/25 focus:border-ink focus:ring-2 focus:ring-ink/20"
                  />
                )}
                <p className="mt-2 rounded-xl bg-stone/60 p-2 text-xs text-muted-2">
                  Scanners enter this password before the QR opens. Stored
                  hashed (bcrypt). We never keep the plaintext.
                </p>
              </>
            ) : (
              <p className="rounded-xl bg-stone/60 p-3 text-xs text-muted-2">
                Password protection is available once you have an account:
                create this QR, then add a password from your dashboard.
              </p>
            )}
          </Acc>
          )}
        </div>
      </div>

      <aside className="self-start lg:sticky lg:top-6">
        <div className="grain relative overflow-hidden rounded-panel bg-mint p-4 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/45 blur-2xl"
        />
        <div className="relative flex flex-col items-center gap-4 rounded-card bg-white p-4 shadow-float sm:p-5">
          <p className="self-start font-body text-xs font-medium uppercase tracking-[0.14em] text-muted-3">
            Live preview
          </p>
          <div ref={previewRef} className="inline-block bg-white p-2">
            <FramedQr
              frame={style.frame_style}
              frameColor={style.frame_color}
              textColor={style.text_color}
              text={style.qr_text}
            >
              <QrPreview hideActions style={previewStyle} />
            </FramedQr>
          </div>
          {showDownloads && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => downloadFramed("png")}
              className={dlBtn}
            >
              <Download className="h-4 w-4" /> PNG
            </button>
            <button
              type="button"
              onClick={() => downloadFramed("svg")}
              className={dlBtn}
            >
              <Download className="h-4 w-4" /> SVG
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className={dlBtn}
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
          )}
          {previewFooter && <div className="w-full">{previewFooter}</div>}
        </div>
        </div>
      </aside>
    </div>
  );
}

const dlBtn =
  "inline-flex h-10 items-center gap-1.5 rounded-full bg-stone px-4 font-body text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30";

function Acc({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className={`rounded-card border bg-white transition-shadow ${
        open ? "border-ink/15 shadow-card" : "border-stone-dark hover:border-ink/20"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-card px-5 py-3 text-left font-heading text-[17px] font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        {title}
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
            open ? "bg-lime text-ink" : "bg-stone text-ink"
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="border-t border-stone-dark p-5 font-body">{children}</div>}
    </div>
  );
}

/** Distribution controls for the multi-color palette: spread mode
 *  (scattered confetti vs clustered blobby regions) + a rare accent
 *  sprinkle color (the "herbs on the pizza" look). Emits null when
 *  everything is back at defaults so the row persists NULL. */
function PaletteOptionsControls({
  value,
  fallbackAccent,
  onChange,
}: {
  value: PaletteOptions | null;
  fallbackAccent: string;
  onChange: (v: PaletteOptions | null) => void;
}) {
  const po: PaletteOptions =
    value ?? {
      mode: "scatter",
      weights: null,
      accent_color: null,
      accent_share: 0.06,
      accent_style: "dots",
      cluster_size: 3,
    };
  // Normalize through the shared validator: all-defaults → null.
  const emit = (next: PaletteOptions) => onChange(cleanPaletteOptions(next));

  return (
    <div className="space-y-3 rounded-xl bg-stone/60 p-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-muted">
          Color spread
        </span>
        <select
          value={po.mode}
          onChange={(e) =>
            emit({
              ...po,
              mode:
                e.target.value === "cluster"
                  ? "cluster"
                  : e.target.value === "organic"
                    ? "organic"
                    : "scatter",
            })
          }
          className="h-11 w-full rounded-xl border border-stone-dark bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
        >
          <option value="scatter">Scattered (confetti mix)</option>
          <option value="cluster">Clustered (blobby regions)</option>
          <option value="organic">Organic blobs (ragged edges)</option>
        </select>
      </label>
      {(po.mode === "cluster" || po.mode === "organic") && (
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-sm font-medium text-muted">
            <span>Region size</span>
            <span className="text-xs text-muted-3">{po.cluster_size}×{po.cluster_size} dots</span>
          </span>
          <input
            type="range"
            min={2}
            max={6}
            step={1}
            value={po.cluster_size}
            onChange={(e) => emit({ ...po, cluster_size: Number(e.target.value) })}
            className="w-full accent-ink"
          />
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={!!po.accent_color}
          onChange={(e) =>
            emit({ ...po, accent_color: e.target.checked ? fallbackAccent : null })
          }
        />
        Accent sprinkle (rare extra color)
      </label>
      {po.accent_color && (
        <>
          <ColorRow
            label="Accent color"
            value={po.accent_color}
            onChange={(v) => emit({ ...po, accent_color: v })}
          />
          <label className="block">
            <span className="mb-1 flex items-center justify-between text-sm font-medium text-muted">
              <span>Sprinkle amount</span>
              <span className="text-xs text-muted-3">
                ~{Math.round(po.accent_share * 100)}% of dots
              </span>
            </span>
            <input
              type="range"
              min={0.02}
              max={0.2}
              step={0.01}
              value={po.accent_share}
              onChange={(e) => emit({ ...po, accent_share: Number(e.target.value) })}
              className="w-full accent-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">
              Sprinkle style
            </span>
            <select
              value={po.accent_style}
              onChange={(e) =>
                emit({ ...po, accent_style: e.target.value === "mini" ? "mini" : "dots" })
              }
              className="h-11 w-full rounded-xl border border-stone-dark bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
            >
              <option value="dots">Small rare dots</option>
              <option value="mini">Mini clusters</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
}

/* ────────────── style presets ──────────────
 * A built-in "Pizza Campaign" preset (the client-spec look) + user presets
 * saved to localStorage. A preset only touches STYLE fields — logo image,
 * frame text, and password are never clobbered. */

const PRESET_KEY = "masaar.style_presets";

type StylePreset = Partial<
  Pick<
    Customization,
    | "fg_color"
    | "bg_color"
    | "gradient_color"
    | "dot_style"
    | "corner_style"
    | "dot_palette"
    | "corner_colors"
    | "palette_options"
    | "logo_scale"
  >
>;

const PIZZA_CAMPAIGN: StylePreset = {
  fg_color: "#A81705",
  bg_color: "#FCFADB",
  gradient_color: null,
  dot_style: "rounded",
  corner_style: "extra-rounded",
  dot_palette: ["#A81705", "#CE8618", "#36A317", "#6F3C22"],
  corner_colors: ["#9E1205", "#9E1205", "#9E1205"],
  palette_options: {
    mode: "organic",
    weights: [52, 38, 6, 4],
    accent_color: null,
    accent_share: 0.06,
    accent_style: "dots",
    cluster_size: 5,
  },
  logo_scale: 0.16,
};

function loadPresets(): Record<string, StylePreset> {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY) || "{}");
  } catch {
    return {};
  }
}

function StylePresets({
  c,
  setC,
}: {
  c: Customization;
  setC: Dispatch<SetStateAction<Customization>>;
}) {
  const [saved, setSaved] = useState<Record<string, StylePreset>>({});
  useEffect(() => setSaved(loadPresets()), []);

  const apply = (p: StylePreset) =>
    setC((prev) => ({
      ...prev,
      ...p,
      // Re-validate persisted/preset options through the shared cleaner.
      palette_options: cleanPaletteOptions(p.palette_options ?? null),
    }));

  function saveCurrent() {
    const name = window.prompt("Preset name:", "My style");
    if (!name?.trim()) return;
    const preset: StylePreset = {
      fg_color: c.fg_color,
      bg_color: c.bg_color,
      gradient_color: c.gradient_color,
      dot_style: c.dot_style,
      corner_style: c.corner_style,
      dot_palette: c.dot_palette,
      corner_colors: c.corner_colors,
      palette_options: c.palette_options,
      logo_scale: c.logo_scale,
    };
    const next = { ...loadPresets(), [name.trim()]: preset };
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(next));
      setSaved(next);
    } catch {
      /* storage full/private mode — non-fatal */
    }
  }

  function remove(name: string) {
    const next = { ...loadPresets() };
    delete next[name];
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
    setSaved(next);
  }

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-medium text-muted">Style presets</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply(PIZZA_CAMPAIGN)}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          <Pizza className="mr-1 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />Pizza Campaign
        </button>
        {Object.entries(saved).map(([name, p]) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-medium text-muted"
          >
            <button type="button" onClick={() => apply(p)} className="hover:text-ink">
              {name}
            </button>
            <button
              type="button"
              aria-label={`Delete preset ${name}`}
              onClick={() => remove(name)}
              className="text-muted-3 hover:text-red-600"
            >
              ✕
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={saveCurrent}
          className="rounded-full border border-dashed border-ink/25 px-3 py-1.5 text-xs font-medium text-muted-3 hover:border-ink/40 hover:text-ink"
        >
          + Save current
        </button>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-stone-dark bg-white p-1" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-stone-dark bg-white px-3 font-mono text-xs uppercase text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
      </span>
    </label>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-stone-dark bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/-/g, " ")}</option>
        ))}
      </select>
    </label>
  );
}

// Read a raster image's natural pixel dimensions client-side (for the
// low-resolution quality hint). Rejects if the file can't be decoded.
function readImageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

function LogoUpload({
  shortId,
  isAuthed,
  draftToken,
  value,
  onChange,
}: {
  shortId: string;
  isAuthed: boolean;
  draftToken: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  // Free plan: 500 KB, PNG/JPG/WebP for everyone (server-enforced by
  // /api/qr/anonymous/logo and the `logos` bucket rules in migration 031).
  // SVG is refused — the bucket is public and SVG can carry script.
  const maxBytes = 500 * 1024;
  const maxLabel = "500 KB";
  const LOGO_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };

  async function handle(file: File) {
    setErr(null);
    setWarn(null);
    if (!LOGO_EXT[file.type]) {
      setErr("PNG, JPG or WebP only.");
      return;
    }
    if (file.size > maxBytes) {
      setErr(`Logo must be under ${maxLabel}.`);
      return;
    }
    // Quality hint (non-blocking): an enlarged logo looks soft mainly when
    // the SOURCE is low-res — we never downscale it.
    {
      const dims = await readImageSize(file).catch(() => null);
      if (dims && Math.min(dims.w, dims.h) < 512) {
        setWarn(
          `Heads up: this logo is ${dims.w}×${dims.h}px, so it can look soft at larger sizes. For crisp print, use 512×512 or larger.`
        );
      }
    }
    setBusy(true);
    try {
      if (isAuthed) {
        // Authed direct upload — RLS scopes path to user.id.
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
          setErr("Sign in to upload a logo.");
          return;
        }
        // Extension from the validated MIME, never the user's filename.
        const ext = LOGO_EXT[file.type];
        const path = `${user.id}/${shortId}/${crypto.randomUUID()}.${ext}`;
        const { error: e } = await sb.storage
          .from("logos")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (e) {
          setErr(e.message);
          return;
        }
        onChange(sb.storage.from("logos").getPublicUrl(path).data.publicUrl);
      } else {
        // Anon path — POST to /api/qr/anonymous/logo. Server validates,
        // rate-limits per IP (5/hr via migration 012's RPC), and uploads
        // via the admin client to anon/<draft_token>/<uuid>.<ext>.
        const fd = new FormData();
        fd.append("draft_token", draftToken);
        fd.append("file", file);
        const res = await fetch("/api/qr/anonymous/logo", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json().catch(() => null)) as
          | { url?: string; error?: string; message?: string }
          | null;
        if (!res.ok || !data?.url) {
          setErr(data?.message || data?.error || "Couldn’t upload logo.");
          return;
        }
        onChange(data.url);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="logo" className="h-10 w-10 rounded border border-ink/15 object-contain" />
        )}
        <label className="cursor-pointer rounded-xl border border-ink/15 px-3 py-1.5 text-sm font-medium text-muted hover:bg-stone">
          {busy ? "Uploading…" : value ? "Replace" : "Upload logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handle(f);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-muted-3 hover:text-muted">
            Reset
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      {warn && <p className="mt-1 text-xs text-amber-600">{warn}</p>}
      <p className="mt-1 text-xs text-muted-3">
        PNG, JPG or WebP · under {maxLabel} · 512×512 or larger for best quality
      </p>
    </div>
  );
}
