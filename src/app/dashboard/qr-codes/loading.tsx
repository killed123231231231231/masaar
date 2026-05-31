import Skeleton from "@/components/ui/skeleton";

// Loading boundary for /dashboard/qr-codes. The generic dashboard skeleton
// shows a KPI/trend layout that doesn't match this page, so the transition felt
// jarring. This list-shaped skeleton (header + search + rows) maps onto the
// real layout, so the page swaps in smoothly.
export default function QrCodesLoading() {
  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 bg-deep-teal lg:block" />
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Skeleton className="h-7 w-44" />
              <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>

          {/* Search + filter */}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>

          {/* Rows */}
          <ul className="mt-7 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${
                  i < 4 ? "border-b border-charcoal/5" : ""
                }`}
              >
                <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-[1.4] space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="hidden min-w-0 flex-[1.4] space-y-2 md:block">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
