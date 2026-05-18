"use client";

import { useEffect, useRef, useState } from "react";
import QrCustomizer, { type SavePayload } from "@/components/qr-customizer";
import EmailGateModal from "@/components/email-gate-modal";

const DRAFT_KEY = "masaar.draft_token";

/**
 * Public, no-auth QR builder. Builds entirely client-side; on the first
 * save trigger it POSTs to /api/qr/anonymous with a stable draft_token
 * (persisted in localStorage so a refresh keeps the same draft).
 *
 * The post-save step here is interim — Session A §6 replaces the inline
 * confirmation with the email-gate modal + /auth/claim conversion.
 */
export default function CreateClient() {
  const draftToken = useRef<string>("");
  const [saving, setSaving] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  // Stable per-visitor draft token. No DB row is created until save, so
  // generating eagerly here is cheap and survives a refresh.
  useEffect(() => {
    let t = "";
    try {
      t = localStorage.getItem(DRAFT_KEY) || "";
      if (!t) {
        t = crypto.randomUUID();
        localStorage.setItem(DRAFT_KEY, t);
      }
    } catch {
      // localStorage blocked (private mode) — in-memory token; the
      // funnel still works for this session.
      t = t || crypto.randomUUID();
    }
    draftToken.current = t;
  }, []);

  async function handleSave(payload: SavePayload) {
    if (!draftToken.current) draftToken.current = crypto.randomUUID();
    setSaving(true);
    const res = await fetch("/api/qr/anonymous", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, draft_token: draftToken.current }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res
        .json()
        .catch(() => ({ error: "Failed to save" }));
      alert(error || "Failed to save");
      return;
    }
    // Row created (user_id NULL, pending_payment). Convert via email gate.
    setGateOpen(true);
  }

  return (
    <>
      <QrCustomizer onSave={handleSave} saving={saving} />
      <EmailGateModal
        open={gateOpen}
        draftToken={draftToken.current}
        onClose={() => setGateOpen(false)}
      />
    </>
  );
}
