import { Bone } from "@/components/dashboard/ui";

// Loading boundary for /dashboard/qr-codes — list-shaped (header + search +
// rows) so the page swaps in smoothly.
export default function QrCodesLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 bg-ink lg:block" />
        <main className="min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Bone className="h-9 w-52" />
                <Bone className="mt-3 h-4 w-72 max-w-full" />
              </div>
              <Bone className="h-10 w-40 rounded-full" />
            </div>
            <Bone className="mt-7 h-11 w-full max-w-md rounded-full" />
            <ul className="mt-6 overflow-hidden rounded-card border border-stone-dark/70 bg-white">
              {Array.from({ length: 5 }).map((_, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-4 px-4 py-4 sm:px-5 ${i < 4 ? "border-b border-stone" : ""}`}
                >
                  <Bone className="h-16 w-16 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-[1.4] space-y-2">
                    <Bone className="h-3 w-14" />
                    <Bone className="h-4 w-40" />
                  </div>
                  <div className="hidden min-w-0 flex-[1.4] space-y-2 md:block">
                    <Bone className="h-3 w-14" />
                    <Bone className="h-4 w-56" />
                  </div>
                  <Bone className="hidden h-6 w-20 rounded-full md:block" />
                  <Bone className="h-8 w-20 rounded-full" />
                  <Bone className="h-10 w-10 rounded-full" />
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
