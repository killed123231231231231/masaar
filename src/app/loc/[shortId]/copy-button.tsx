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
      className="flex w-full items-center justify-center gap-2 rounded-full bg-stone px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark"
    >
      {done ? (
        <>
          <Check className="h-4 w-4 text-ink" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy coordinates
        </>
      )}
    </button>
  );
}
