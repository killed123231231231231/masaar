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
      className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-8 text-center shadow-sm"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-deep-teal/10 text-deep-teal">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-display text-xl font-bold text-charcoal">
        This QR is password-protected
      </h1>
      {name && <p className="mt-1 text-sm text-charcoal/55">{name}</p>}

      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Enter password"
        autoFocus
        className="mt-6 block w-full rounded-lg border border-charcoal/15 px-4 py-3 text-center text-sm text-charcoal outline-none transition-colors focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/15"
      />
      {err && <p className="mt-3 text-sm font-medium text-terracotta-dark">{err}</p>}

      <button
        type="submit"
        disabled={submitting || !pw}
        className="mt-5 w-full rounded-xl bg-deep-teal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark disabled:opacity-60"
      >
        {submitting ? "Unlocking…" : "Unlock"}
      </button>
    </form>
  );
}
