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
      // toast (not alert) — matches the non-blocking error pattern used by
      // the wizard, list, and edit page; this was the last alert() in the app.
      const { error } = await res.json().catch(() => ({ error: null }));
      toast.error(error || "Couldn’t create the QR. Try again.");
      return;
    }
    const row = await res.json().catch(() => null);
    // Subscriber → active immediately: confirm + back to dashboard.
    // Pending dynamic → checkout lock-in. Static → the QR's page.
    if (row?.status === "active") {
      toast.success("QR created!");
      setTimeout(() => {
        router.push("/dashboard?welcome_new_qr=1");
        router.refresh();
      }, 800);
    } else if (row?.short_id) {
      router.push(`/checkout/${row.short_id}`);
      router.refresh();
    } else {
      router.push(`/dashboard/qr/${row?.id}`);
      router.refresh();
    }
  }

  return <QrCustomizer onSave={handleSave} saving={saving} allowLogo />;
}
