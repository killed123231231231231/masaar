"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QrCustomizer, { type SavePayload } from "@/components/qr-customizer";

export default function NewQrClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSave(payload: SavePayload) {
    setSaving(true);
    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      alert(error || "Failed to save");
      return;
    }
    const { id } = await res.json();
    router.push(`/dashboard/qr/${id}`);
  }

  return <QrCustomizer onSave={handleSave} saving={saving} />;
}
