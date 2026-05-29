"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked — no-op */
        }
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm font-semibold text-charcoal transition hover:bg-sand-light"
    >
      {done ? (
        <>
          <Check className="h-4 w-4 text-deep-teal" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy coordinates
        </>
      )}
    </button>
  );
}
