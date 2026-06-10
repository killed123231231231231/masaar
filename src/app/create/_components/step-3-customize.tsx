"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction,
} from "react";
import { ChevronDown, Download } from "lucide-react";
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

  async function downloadFramed(format: "png" | "svg") {
    const node = previewRef.current;
    if (!node) return;
    const lib = await import("html-to-image");
    const dataUrl =
      format === "png"
        ? await lib.toPng(node, {
            pixelRatio: exportPixelRatio(node),
            cacheBust: true,
            backgroundColor: "#ffffff",
          })
        : await lib.toSvg(node, { cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `masaar-qr.${format}`;
    a.click();
  }

  // Print-ready PDF (A4): the framed QR centered + a Masaar footer. Done
  // client-side so it works before the QR is saved (no id needed).
  async function downloadPdf() {
    const node = previewRef.current;
    if (!node) return;
    const [{ toPng }, pdfLib] = await Promise.all([
      import("html-to-image"),
      import("pdf-lib"),
    ]);
    const { PDFDocument, rgb, StandardFonts } = pdfLib;
    const pngUrl = await toPng(node, {
      pixelRatio: exportPixelRatio(node),
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
    const pngBytes = await (await fetch(pngUrl)).arrayBuffer();
    const pdf = await PDFDocument.create();
    const A4 = { w: 595.28, h: 841.89 };
    const page = pdf.addPage([A4.w, A4.h]);
    const png = await pdf.embedPng(pngBytes);
    const w = 340;
    const h = (png.height / png.width) * w;
    page.drawImage(png, { x: (A4.w - w) / 2, y: (A4.h - h) / 2 + 30, width: w, height: h });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const footer = "Created with Masaar · masaar.sa";
    const fs = 10;
    const tw = font.widthOfTextAtSize(footer, fs);
    page.drawText(footer, { x: (A4.w - tw) / 2, y: 64, size: fs, font, color: rgb(0.42, 0.42, 0.42) });
    const bytes = await pdf.save();
    const url = URL.createObjectURL(
      new Blob([bytes as unknown as BlobPart], { type: "application/pdf" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "masaar-qr.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Keep the parent's download handle pointed at the current export fn so the
  // wizard footer's "Download" button produces the same framed PNG/SVG.
  useEffect(() => {
    if (downloadRef) downloadRef.current = (format) => downloadFramed(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition ${
                active
                  ? "border-deep-teal ring-1 ring-deep-teal"
                  : "border-charcoal/10 hover:border-deep-teal/40"
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
                    <span className="block h-20 w-20 bg-charcoal" />
                  </FramedQr>
                </span>
              </span>
              <span className="text-center text-[10px] leading-tight text-charcoal/55">
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
            className={`grid aspect-square place-items-center overflow-hidden rounded-lg border p-1 transition ${
              c.logo_url === p.url
                ? "border-deep-teal ring-1 ring-deep-teal"
                : "border-charcoal/10 hover:border-deep-teal/40"
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
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        {showHeading && (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
              Customize &amp; protect
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">
              Optional — defaults look great too.
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
            <div className="grid grid-cols-2 gap-4">
              <ColorRow label="QR color" value={c.fg_color} onChange={(v) => set("fg_color", v)} />
              <ColorRow label="Background" value={c.bg_color} onChange={(v) => set("bg_color", v)} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-charcoal/70">
              <input
                type="checkbox"
                checked={c.gradient_color !== null}
                onChange={(e) => set("gradient_color", e.target.checked ? c.fg_color : null)}
              />
              Gradient
            </label>
            {c.gradient_color !== null && (
              <div className="mt-2">
                <ColorRow label="Gradient end" value={c.gradient_color} onChange={(v) => set("gradient_color", v)} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <SelectRow label="QR shape" value={c.dot_style} options={DOT_STYLES} onChange={(v) => set("dot_style", v)} />
              <SelectRow label="Corner shape" value={c.corner_style} options={CORNER_STYLES} onChange={(v) => set("corner_style", v)} />
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-charcoal/75">QR text label</span>
              <input
                value={c.qr_text}
                onChange={(e) => set("qr_text", e.target.value)}
                placeholder="Scan me!"
                className="block w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
              />
              <span className="mt-1 block text-xs text-charcoal/45">
                Shows under the QR for frames with a text region (Session I).
              </span>
            </label>
          </Acc>

          <Acc title="Logo" defaultOpen={false}>
            {previewData.startsWith("WIFI:") && c.logo_url && (
              <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-700">
                ⚠️ WiFi QR codes are small — a logo can cover too much and make
                them <strong>unscannable</strong>. For WiFi we recommend removing
                the logo (or keeping it very small).
              </p>
            )}
            <p className="mb-2 text-sm font-medium text-charcoal/75">Quick icons</p>
            {logoPresets}
            <p className="mb-2 text-sm font-medium text-charcoal/75">Or upload your own</p>
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
                <span className="mb-1 flex items-center justify-between text-sm font-medium text-charcoal/75">
                  <span>Logo size</span>
                  <span className="text-xs text-charcoal/45">
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
                  className="w-full accent-deep-teal"
                />
                <span className="mt-1 block text-xs text-charcoal/45">
                  Bigger logos can make the QR harder to scan — keep it readable.
                </span>
              </label>
            )}
          </Acc>

          {showPassword && (
          <Acc title="Protect this QR with a password" defaultOpen={false}>
            {isAuthed ? (
              <>
                <label className="flex items-center gap-2 text-sm text-charcoal/70">
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
                    className="mt-3 block w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
                  />
                )}
                <p className="mt-2 rounded-lg bg-sand-light/60 p-2 text-xs text-charcoal/55">
                  Scanners enter this password before the QR opens. Stored
                  hashed (bcrypt) — we never keep the plaintext.
                </p>
              </>
            ) : (
              <p className="rounded-lg bg-sand-light/60 p-3 text-xs text-charcoal/55">
                Password protection is available once you have an account —
                create this QR, then add a password from your dashboard.
              </p>
            )}
          </Acc>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadFramed("png")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-4 py-2 text-sm font-semibold text-charcoal/75 transition-colors hover:bg-sand-light"
            >
              <Download className="h-4 w-4" /> PNG
            </button>
            <button
              type="button"
              onClick={() => downloadFramed("svg")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-4 py-2 text-sm font-semibold text-charcoal/75 transition-colors hover:bg-sand-light"
            >
              <Download className="h-4 w-4" /> SVG
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-4 py-2 text-sm font-semibold text-charcoal/75 transition-colors hover:bg-sand-light"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
          )}
          {previewFooter && <div className="w-full">{previewFooter}</div>}
        </div>
      </aside>
    </div>
  );
}

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
    <div className="rounded-xl border border-charcoal/10 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-charcoal"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-charcoal/10 p-4">{children}</div>}
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
      <span className="mb-1 block text-sm font-medium text-charcoal/75">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border border-charcoal/15" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-charcoal/15 px-2 text-xs" />
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
      <span className="mb-1 block text-sm font-medium text-charcoal/75">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-charcoal/15 bg-white px-2 text-sm capitalize"
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

  // Anon path caps at 500 KB (server-enforced via /api/qr/anonymous/logo);
  // authed path is the existing 5 MB direct-to-storage upload.
  const maxBytes = isAuthed ? 5 * 1024 * 1024 : 500 * 1024;
  const maxLabel = isAuthed ? "5 MB" : "500 KB";

  async function handle(file: File) {
    setErr(null);
    setWarn(null);
    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) {
      setErr("PNG, JPG or SVG only.");
      return;
    }
    if (file.size > maxBytes) {
      setErr(`Logo must be under ${maxLabel}.`);
      return;
    }
    // Quality hint (non-blocking): an enlarged logo looks soft mainly when
    // the SOURCE is low-res — we never downscale it. SVG is vector → always
    // crisp, so skip the check for it.
    if (file.type !== "image/svg+xml") {
      const dims = await readImageSize(file).catch(() => null);
      if (dims && Math.min(dims.w, dims.h) < 512) {
        setWarn(
          `Heads up: this logo is ${dims.w}×${dims.h}px, so it can look soft at larger sizes. For crisp print, use 512×512 or larger — or upload an SVG.`
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
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
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
          <img src={value} alt="logo" className="h-10 w-10 rounded border border-charcoal/15 object-contain" />
        )}
        <label className="cursor-pointer rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light/60">
          {busy ? "Uploading…" : value ? "Replace" : "Upload logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
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
          <button type="button" onClick={() => onChange(null)} className="text-xs text-charcoal/45 hover:text-charcoal/70">
            Reset
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      {warn && <p className="mt-1 text-xs text-amber-600">{warn}</p>}
      <p className="mt-1 text-xs text-charcoal/45">
        PNG/JPG/SVG · under {maxLabel} · 512×512+ or SVG for best quality
      </p>
    </div>
  );
}
