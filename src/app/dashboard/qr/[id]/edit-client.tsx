"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QrPreview from "@/components/qr-preview";
import type { QrCode } from "@/types/database";
import { appUrl } from "@/lib/utils";

const DOT_STYLES = [
  "square",
  "dots",
  "rounded",
  "classy",
  "classy-rounded",
  "extra-rounded",
];
const CORNER_STYLES = ["square", "dot", "extra-rounded"];

export default function EditQrClient({ initial }: { initial: QrCode }) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial.destination);
  const [name, setName] = useState(initial.name);
  const [fgColor, setFgColor] = useState(initial.fg_color);
  const [bgColor, setBgColor] = useState(initial.bg_color);
  const [gradient, setGradient] = useState<string | null>(
    initial.gradient_color
  );
  const [dotStyle, setDotStyle] = useState(initial.dot_style);
  const [cornerStyle, setCornerStyle] = useState(initial.corner_style);
  const [saving, setSaving] = useState(false);

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
        fg_color: fgColor,
        bg_color: bgColor,
        gradient_color: gradient,
        dot_style: dotStyle,
        corner_style: cornerStyle,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      alert("Failed to save");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Section title="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 h-11 px-3 text-sm transition-colors duration-150 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/30"
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
            className="block w-full rounded-lg border border-gray-200 h-11 px-3 text-sm transition-colors duration-150 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:bg-gray-50"
          />
          {initial.kind === "static" && (
            <p className="mt-2 text-xs text-amber-600">
              Static QRs can&apos;t be edited — the value is embedded directly
              in the printed code.
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400 capitalize">
            Type: {initial.kind} · {initial.content_kind} (locked)
          </p>
        </Section>

        <Section title="Design">
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
            <ColorField label="Background" value={bgColor} onChange={setBgColor} />
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={gradient !== null}
                onChange={(e) =>
                  setGradient(e.target.checked ? fgColor : null)
                }
              />
              Use gradient
            </label>
            {gradient !== null && (
              <div className="mt-2">
                <ColorField
                  label="Gradient end"
                  value={gradient}
                  onChange={setGradient}
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <SelectField
              label="Dot style"
              value={dotStyle}
              options={DOT_STYLES}
              onChange={setDotStyle}
            />
            <SelectField
              label="Corner style"
              value={cornerStyle}
              options={CORNER_STYLES}
              onChange={setCornerStyle}
            />
          </div>
        </Section>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-lg bg-deep-teal px-4 py-3 text-sm font-semibold text-white hover:bg-deep-teal-dark transition-colors duration-200 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <aside className="lg:sticky lg:top-8 self-start">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <QrPreview
            style={{
              data: previewData,
              fgColor,
              bgColor,
              gradientColor: gradient,
              dotStyle,
              cornerStyle,
              logoUrl: initial.logo_url,
            }}
          />
        </div>
      </aside>
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
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ColorField({
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
      <span className="block text-xs font-medium text-gray-500">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-gray-200"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-200 px-2 text-xs"
        />
      </span>
    </label>
  );
}

function SelectField({
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
      <span className="block text-xs font-medium text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/-/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
