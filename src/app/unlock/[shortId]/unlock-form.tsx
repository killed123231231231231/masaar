"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export default function UnlockForm({
  shortId,
  name,
}: {
  shortId: string;
  name: string;
}) {
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/qr/unlock/${shortId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        // Cookie set — reload; the page now verifies it and redirects onward.
        window.location.reload();
        return;
      }
      const j = await res.json().catch(() => ({}));
      setErr(
        j.error === "locked"
          ? "Too many attempts. Try again in ~15 minutes."
          : "Incorrect password."
      );
      setSubmitting(false);
    } catch {
      setErr("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-panel border border-stone-dark bg-white p-8 text-center shadow-card"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-ink">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-heading text-2xl font-medium text-ink">
        This QR is password-protected
      </h1>
      {name && <p className="mt-1 text-sm text-muted-3">{name}</p>}

      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Enter password"
        aria-label="Password"
        autoFocus
        className="mt-6 block w-full min-h-[44px] rounded-xl border border-stone-dark bg-white px-4 py-3 hover:border-ink/25 text-center text-sm text-ink outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-ink/20"
      />
      {err && <p className="mt-3 text-sm font-medium text-red-700">{err}</p>}

      <button
        type="submit"
        disabled={submitting || !pw}
        className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? "Unlocking…" : "Unlock"}
      </button>
    </form>
  );
}
