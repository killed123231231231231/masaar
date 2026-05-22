import Skeleton from "@/components/ui/skeleton";

// Loading boundary (Suspense fallback) for the dashboard Overview — streams a
// sidebar + KPI-row + trend skeleton matching the new sand-cream shell while
// getAccountAnalytics resolves.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <div className="mx-auto flex max-w-[1440px]">
        {/* Sidebar placeholder (lg+) */}
        <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 bg-deep-teal lg:block" />
        <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
            {/* Header */}
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-80" />

            {/* Period pills */}
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>

            {/* KPI row */}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm"
                >
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="mt-3 h-3 w-20" />
                  <Skeleton className="mt-1 h-6 w-16" />
                </div>
              ))}
            </div>

            {/* Trend */}
            <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-64 w-full" />
            </div>
          </main>
          {/* Right rail placeholder (xl+) */}
          <aside className="hidden shrink-0 border-l border-charcoal/10 bg-white px-5 py-6 xl:block xl:w-[300px]">
            <Skeleton className="h-4 w-24" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
