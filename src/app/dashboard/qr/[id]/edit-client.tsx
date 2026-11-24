"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Repeat2 } from "lucide-react";
import Step3Customize from "@/app/create/_components/step-3-customize";
import { DEFAULT_CUSTOMIZATION, type Customization } from "@/app/create/_lib/types";
import type { QrCode } from "@/types/database";
import { appUrl } from "@/lib/utils";
import { normalizeUrl, parseHttpUrl } from "@/lib/url";
import {
  cleanHexArray,
  cleanPaletteOptions,
  DOT_PALETTE_MIN,
  DOT_PALETTE_MAX,
  CORNER_COUNT,
} from "@/lib/palette";

// Friendly label for the QR's current hosted type (drives the convert copy).
const TYPE_LABEL: Record<string, string> = {
  pdf: "PDF", image: "image", video: "video", social: "social links",
  location: "location", feedback: "feedback", whatsapp: "WhatsApp",
  app_link: "app store", url: "website",
};

export default function EditQrClient({ initial }: { initial: QrCode }) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial.destination);
  const [name, setName] = useState(initial.name);
  // Save button lifecycle: idle → saving → saved (2s) → idle. The page
  // stays put after a save; router.refresh() pulls the new name/title.
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(t);
  }, [saveState]);

  // Type conversion — only a DYNAMIC, non-url QR can be turned into a plain
  // website link (server enforces the same rule). Printed code is unchanged.
  const canConvertType =
    initial.kind === "dynamic" && initial.content_kind !== "url";
  const [convertToUrl, setConvertToUrl] = useState(false);
  const [targetUrl, setTargetUrl] = useState(
    initial.destination && /^https?:\/\//i.test(initial.destination)
      ? initial.destination
      : ""
  );

  // Seed the shared customize panel from the saved row so the edit page has
  // the SAME controls as create Step-3 (frames, logo + presets, colours,
  // framed PNG/SVG/PDF). Password is never surfaced here — it's managed on
  // its own and we don't echo the existing one back.
  const [cust, setCust] = useState<Customization>({
    ...DEFAULT_CUSTOMIZATION,
    fg_color: initial.fg_color,
    bg_color: initial.bg_color,
    // If a row somehow carries both a palette and a gradient (legacy/direct
    // API), the renderer lets the palette win — reflect that in the seed so
    // the UI never shows a contradictory gradient+multicolor state.
    gradient_color: initial.dot_palette ? null : initial.gradient_color,
    dot_style: initial.dot_style,
    corner_style: initial.corner_style,
    logo_url: initial.logo_url,
    logo_scale: initial.logo_scale ?? 0.3,
    qr_text: initial.frame_text ?? "",
    frame_style: initial.frame_style ?? "none",
    frame_color: initial.frame_color ?? DEFAULT_CUSTOMIZATION.frame_color,
    text_color: initial.text_color ?? DEFAULT_CUSTOMIZATION.text_color,
    password: "",
    dot_palette: initial.dot_palette ?? null,
    corner_colors: initial.corner_colors ?? null,
    palette_options: cleanPaletteOptions(initial.palette_options),
  });

  // Dynamic QRs always encode /r/<short_id> (so the destination stays
  // editable without reprinting); static QRs encode their payload directly.
  const previewData =
    initial.kind === "dynamic" && initial.short_id
      ? `${appUrl()}/r/${initial.short_id}`
      : destination || " ";

  async function save() {
    // Type conversion overrides content_kind + destination. Validate the URL
    // client-side first so we never send a conversion the server will 400.
    let convertFields: Record<string, unknown> = {};
    if (convertToUrl) {
      const normalized = normalizeUrl(targetUrl);
      if (!parseHttpUrl(normalized)) {
        toast.error("Enter a valid website URL, like https://your-site.com");
        return;
      }
      convertFields = { content_kind: "url", destination: normalized };
    }
    setSaveState("saving");
    let res: Response;
    try {
      res = await fetch("/api/qr", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: initial.id,
        name,
        destination,
        fg_color: cust.fg_color,
        bg_color: cust.bg_color,
        gradient_color: cust.gradient_color,
        dot_style: cust.dot_style,
        corner_style: cust.corner_style,
        logo_url: cust.logo_url,
        logo_scale: cust.logo_scale,
        qr_text: cust.qr_text,
        frame_style: cust.frame_style,
        frame_color: cust.frame_color,
        text_color: cust.text_color,
        // Validate with the same rule as preview/server so what we send is
        // exactly what persists — invalid → null → explicitly clears (never a
        // silent divergence between the preview and the saved row).
        dot_palette: cleanHexArray(cust.dot_palette, DOT_PALETTE_MIN, DOT_PALETTE_MAX),
        corner_colors: cleanHexArray(cust.corner_colors, CORNER_COUNT, CORNER_COUNT),
        palette_options: cleanPaletteOptions(cust.palette_options),
        // Spread LAST so a type conversion's content_kind + destination win.
        ...convertFields,
      }),
    });
    } catch {
      // Network failure: never leave the button stuck on "Saving…".
      setSaveState("idle");
      toast.error("Couldn’t reach the server. Check your connection and try again.");
      return;
    }
    if (!res.ok) {
      setSaveState("idle");
      const { error, message } = await res.json().catch(() => ({ error: null, message: null }));
      toast.error(message || error || "Couldn’t save changes. Try again.");
      return;
    }
    setSaveState("saved");
    toast.success(convertToUrl ? "Converted to a website link" : "Changes saved");
    router.refresh();
  }

  return (
    <div className="space-y-6 font-body">
      <div className="rounded-panel bg-stone p-1.5">
      <div className="grid gap-5 rounded-[26px] border border-stone-dark bg-white p-5 sm:grid-cols-2 sm:p-6">
        <Section title="Name" htmlFor="qr-edit-name">
          <input
            id="qr-edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Section>

        <Section
          htmlFor="qr-edit-destination"
          title={
            initial.kind === "dynamic"
              ? "Destination URL (editable any time)"
              : "Encoded content"
          }
        >
          <input
            id="qr-edit-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={initial.kind === "static"}
            className={`${inputCls} disabled:cursor-not-allowed disabled:bg-stone disabled:text-muted-2`}
          />
          {initial.kind === "static" && (
            <p className="mt-2 text-xs text-amber-700">
              Static QRs can&apos;t be edited: the value is embedded directly
              in the printed code.
            </p>
          )}
        </Section>
      </div>
      </div>

      {canConvertType && (
        <div className="rounded-panel bg-stone p-1.5">
        <div className="rounded-[26px] border border-stone-dark bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-ink">
              <Repeat2 className="h-4 w-4" />
            </span>
            <h2 className="font-heading text-xl font-medium text-ink">QR type</h2>
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-2">
            When scanned, this QR opens a hosted{" "}
            <span className="font-semibold">
              {TYPE_LABEL[initial.content_kind] ?? initial.content_kind}
            </span>{" "}
            page. You can turn it into a <span className="font-semibold">direct
            website link</span> instead. The printed code keeps working, only
            where it points changes (no reprint).
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-stone py-2 pl-3 pr-4 text-sm font-medium text-ink transition-colors hover:bg-stone-dark">
            <input
              type="checkbox"
              checked={convertToUrl}
              onChange={(e) => setConvertToUrl(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Convert to a website link
          </label>
          {convertToUrl && (
            <div className="mt-4 max-w-xl">
              <label htmlFor="qr-edit-convert-url" className="sr-only">
                Website URL
              </label>
              <input
                id="qr-edit-convert-url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-site.com"
                className={inputCls}
              />
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                On save, scanning this QR jumps straight to this link. The
                hosted {TYPE_LABEL[initial.content_kind] ?? initial.content_kind}{" "}
                page will no longer show. This can’t be auto-undone, so
                double-check the URL.
              </p>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Same customize panel as create Step-3 (frames, logo, framed
          downloads). Heading + password are hidden here. */}
      <Step3Customize
        previewData={previewData}
        shortId={initial.short_id || initial.id}
        isAuthed
        draftToken={initial.id}
        c={cust}
        setC={setCust}
        showHeading={false}
        showPassword={false}
        fileName={name}
        previewFooter={
          <div className="flex justify-center">
            <button
              type="button"
              onClick={save}
              disabled={saveState !== "idle"}
              aria-live="polite"
              className={`group inline-flex h-10 min-w-[168px] items-center justify-between gap-2 rounded-full py-1 pl-4 pr-1 font-body text-sm font-medium shadow-card transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-default ${
                saveState === "saved"
                  ? "bg-lime text-ink"
                  : "bg-ink text-white hover:bg-ink-soft"
              }`}
            >
              <span className="flex-1 text-center">
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save changes"}
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                  saveState === "saved" ? "bg-ink text-lime" : "bg-lime text-ink"
                }`}
              >
                {saveState === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-4 w-4" aria-hidden />
                )}
              </span>
            </button>
          </div>
        }
      />
    </div>
  );
}

const inputCls =
  "block h-11 w-full rounded-xl border border-stone-dark bg-white px-3.5 text-[15px] text-ink outline-none transition-colors duration-150 placeholder:text-muted-3 hover:border-ink/25 focus:border-ink focus:ring-2 focus:ring-ink/20";

function Section({
  title,
  htmlFor,
  children,
}: {
  title: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {title}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
