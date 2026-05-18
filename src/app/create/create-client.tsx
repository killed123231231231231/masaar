"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QrCustomizer, { type SavePayload } from "@/components/qr-customizer";
import EmailGateModal from "@/components/email-gate-modal";

const DRAFT_KEY = "masaar.draft_token";

/**
 * Public QR builder.
 *  - Anonymous: POST /api/qr/anonymous with a localStorage draft_token,
 *    then the email gate converts the draft into an account.
 *  - Authed (Bug 4): skip the gate entirely — POST /api/qr so the row
 *    is owned by the user immediately, then go straight to checkout.
 *    (An authed user hitting signInWithOtp was causing "email rate
 *    limit exceeded".)
 */
export default function CreateClient({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();
  const draftToken = useRef<string>("");
  const [saving, setSaving] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (isAuthed) return; // no draft token needed for owned creates
    let t = "";
    try {
      t = localStorage.getItem(DRAFT_KEY) || "";
      if (!t) {
        t = crypto.randomUUID();
        localStorage.setItem(DRAFT_KEY, t);
      }
    } catch {
      t = t || crypto.randomUUID();
    }
    draftToken.current = t;
  }, [isAuthed]);

  async function handleSave(payload: SavePayload) {
    setSaving(true);

    if (isAuthed) {
      // Owned create — /api/qr attaches user_id from the session cookie.
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaving(false);
      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Failed to save" }));
        alert(error || "Failed to save");
        return;
      }
      const row = await res.json().catch(() => null);
      // Dynamic → activation checkout (same lock-in funnel, no gate).
      // Static (no short_id) → the QR's dashboard detail page.
      router.push(
        row?.short_id ? `/checkout/${row.short_id}` : `/dashboard/qr/${row?.id}`
      );
      return;
    }

    // Anonymous path.
    if (!draftToken.current) draftToken.current = crypto.randomUUID();
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
    setGateOpen(true);
  }

  return (
    <>
      <QrCustomizer onSave={handleSave} saving={saving} />
      {!isAuthed && (
        <EmailGateModal
          open={gateOpen}
          draftToken={draftToken.current}
          onClose={() => setGateOpen(false)}
        />
      )}
    </>
  );
}
