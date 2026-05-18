"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
    const row = await res.json().catch(() => null);
    // Subscriber → active immediately: confirm + back to dashboard.
    // Pending dynamic → checkout lock-in. Static → the QR's page.
    if (row?.status === "active") {
      toast.success("QR created!");
      setTimeout(() => router.push("/dashboard?welcome_new_qr=1"), 800);
    } else if (row?.short_id) {
      router.push(`/checkout/${row.short_id}`);
    } else {
      router.push(`/dashboard/qr/${row?.id}`);
    }
  }

  return <QrCustomizer onSave={handleSave} saving={saving} allowLogo />;
}
