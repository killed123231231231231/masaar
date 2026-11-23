"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { FOCUS } from "@/components/dashboard/ui";
import { pageItems } from "@/components/dashboard/page-items";

const PILL = `inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 font-body text-sm font-medium transition-colors ${FOCUS}`;

/** Stone pill pagination with an ink active page. */
export default function Pagination({
  page,
  pages,
  onChange,
  label = "Pagination",
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${PILL} gap-1 bg-stone pl-2.5 text-ink hover:bg-stone-dark disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Previous</span>
        <span className="sr-only sm:hidden">Previous page</span>
      </button>
      {pageItems(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 font-body text-sm text-muted-3" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`${PILL} tabular-nums ${
              p === page ? "bg-ink text-white" : "bg-stone text-ink hover:bg-stone-dark"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={`${PILL} gap-1 bg-stone pr-2.5 text-ink hover:bg-stone-dark disabled:pointer-events-none disabled:opacity-40`}
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sr-only sm:hidden">Next page</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
