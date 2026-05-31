"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Step3Customize from "@/app/create/_components/step-3-customize";
import { DEFAULT_CUSTOMIZATION, type Customization } from "@/app/create/_lib/types";
import type { QrCode } from "@/types/database";
import { appUrl } from "@/lib/utils";

export default function EditQrClient({ initial }: { initial: QrCode }) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial.destination);
  const [name, setName] = useState(initial.name);
  const [saving, setSaving] = useState(false);

  // Seed the shared customize panel from the saved row so the edit page has
  // the SAME controls as create Step-3 (frames, logo + presets, colours,
  // framed PNG/SVG/PDF). Password is never surfaced here — it's managed on
  // its own and we don't echo the existing one back.
  const [cust, setCust] = useState<Customization>({
    ...DEFAULT_CUSTOMIZATION,
    fg_color: initial.fg_color,
    bg_color: initial.bg_color,
    gradient_color: initial.gradient_color,
    dot_style: initial.dot_style,
    corner_style: initial.corner_style,
    logo_url: initial.logo_url,
    logo_scale: initial.logo_scale ?? 0.3,
    qr_text: initial.frame_text ?? "",
    frame_style: initial.frame_style ?? "none",
    frame_color: initial.frame_color ?? DEFAULT_CUSTOMIZATION.frame_color,
    text_color: initial.text_color ?? DEFAULT_CUSTOMIZATION.text_color,
    password: "",
  });

  // Dynamic QRs always encode /r/<short_id> (so the destination stays
  // editable without reprinting); static QRs encode their payload directly.
  const previewData =
    initial.kind === "dynamic" && initial.short_id
      ? `${appUrl()}/r/${initial.short_id}`
      : destination || " ";

  async function save() {
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
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Couldn’t save changes. Try again.");
      return;
    }
    toast.success("Changes saved");
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
      />

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-deep-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-deep-teal-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
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
