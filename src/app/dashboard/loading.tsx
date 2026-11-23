import { Bone } from "@/components/dashboard/ui";

// Loading boundary (Suspense fallback) for the Overview — mirrors the real
// layout (ink rail, header, full-width KPI row, trend, side column) so the
// swap is calm.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 bg-ink lg:block" />
        <main className="min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Bone className="h-9 w-64" />
                <Bone className="mt-3 h-4 w-80 max-w-full" />
              </div>
              <div className="flex gap-2">
                <Bone className="h-10 w-36 rounded-full" />
                <Bone className="h-10 w-24 rounded-full" />
              </div>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-card border border-stone-dark/70 bg-white p-4 ${
                    i < 3 ? "md:col-span-2 xl:col-span-1" : i === 3 ? "md:col-span-3 xl:col-span-1" : "col-span-2 md:col-span-3 xl:col-span-1"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bone className="h-8 w-8 rounded-full" />
                    <Bone className="h-3 w-20" />
                  </div>
                  <Bone className="mt-4 h-7 w-16" />
                  <Bone className="mt-3 h-4 w-24" />
                </div>
              ))}
            </div>
            <div className="mt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
              <div className="rounded-card border border-stone-dark/70 bg-white p-5">
                <Bone className="h-4 w-40" />
                <Bone className="mt-5 h-64 w-full" />
              </div>
              <div className="mt-6 hidden rounded-card border border-stone-dark/70 bg-white p-5 xl:mt-0 xl:block">
                <Bone className="h-4 w-28" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Bone key={i} className="h-14 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
