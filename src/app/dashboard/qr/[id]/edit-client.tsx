"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    const res = await fetch("/api/qr", {
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
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }));
      toast.error(error || "Couldn’t save changes. Try again.");
      return;
    }
    toast.success(convertToUrl ? "Converted to a website link" : "Changes saved");
    setTimeout(() => router.push("/dashboard/qr-codes"), 800);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-charcoal/15 h-11 px-3 text-sm transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
          />
        </Section>

        <Section
          title={
            initial.kind === "dynamic"
              ? "Destination URL (editable any time)"
              : "Encoded content"
          }
        >
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={initial.kind === "static"}
            className="block w-full rounded-lg border border-charcoal/15 h-11 px-3 text-sm transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20 disabled:bg-sand-light/60"
          />
          {initial.kind === "static" && (
            <p className="mt-2 text-xs text-amber-600">
              Static QRs can&apos;t be edited — the value is embedded directly
              in the printed code.
            </p>
          )}
        </Section>
      </div>

      {canConvertType && (
        <div className="rounded-xl border border-charcoal/10 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal/55">
            QR type
          </h3>
          <p className="mt-2 text-sm text-charcoal/70">
            When scanned, this QR opens a hosted{" "}
            <span className="font-semibold">
              {TYPE_LABEL[initial.content_kind] ?? initial.content_kind}
            </span>{" "}
            page. You can turn it into a <span className="font-semibold">direct
            website link</span> instead — the printed code keeps working, only
            where it points changes (no reprint).
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-charcoal/75">
            <input
              type="checkbox"
              checked={convertToUrl}
              onChange={(e) => setConvertToUrl(e.target.checked)}
            />
            Convert to a website link
          </label>
          {convertToUrl && (
            <div className="mt-3">
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="block w-full rounded-lg border border-charcoal/15 h-11 px-3 text-sm focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
              />
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                On save, scanning this QR jumps straight to this link — the
                hosted {TYPE_LABEL[initial.content_kind] ?? initial.content_kind}{" "}
                page will no longer show. This can’t be auto-undone, so
                double-check the URL.
              </p>
            </div>
          )}
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
        previewFooter={
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-lg bg-deep-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-deep-teal-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal/55">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
