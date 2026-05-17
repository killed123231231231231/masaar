"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QrPreview from "@/components/qr-preview";
import type { QrCode } from "@/types/database";
import { appUrl } from "@/lib/utils";

export default function EditQrClient({ initial }: { initial: QrCode }) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial.destination);
  const [name, setName] = useState(initial.name);
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
      body: JSON.stringify({ id: initial.id, destination, name }),
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
          title={initial.kind === "dynamic" ? "Destination URL (editable any time)" : "Encoded content"}
        >
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={initial.kind === "static"}
            className="block w-full rounded-lg border border-gray-200 h-11 px-3 text-sm transition-colors duration-150 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:bg-gray-50"
          />
          {initial.kind === "static" && (
            <p className="mt-2 text-xs text-amber-600">
              Static QRs can&apos;t be edited — the value is embedded directly in the printed code.
            </p>
          )}
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
              fgColor: initial.fg_color,
              bgColor: initial.bg_color,
              gradientColor: initial.gradient_color,
              dotStyle: initial.dot_style,
              cornerStyle: initial.corner_style,
            }}
          />
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
