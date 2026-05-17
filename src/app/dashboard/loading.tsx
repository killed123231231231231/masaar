import Skeleton from "@/components/ui/skeleton";

// Loading boundary (Suspense fallback) for the dashboard — the page is a
// server component that awaits Supabase, so this streams 6 skeleton
// cards until the real list resolves.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-24" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
