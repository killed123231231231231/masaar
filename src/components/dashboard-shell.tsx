import Link from "next/link";
import { LayoutGrid, LogOut, Plus } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const RING = "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

// Lightweight signed-in shell (top bar) used by surfaces that don't render
// the full sidebar. Same auth check as before; restyled to the 2026-11
// paper / ink / lime system.
export default async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?login=1&redirectTo=/dashboard");

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <header className="sticky top-0 z-30 border-b border-stone-dark/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className={`flex items-center gap-2.5 rounded-full ${RING}`}>
            <LogoMark className="h-8 w-8" />
            <span className="font-heading text-[20px] font-extrabold tracking-[-0.03em] text-ink">
              Vertexa QR
            </span>
          </Link>

          <nav aria-label="Account" className="flex items-center gap-1.5 text-sm">
            <Link
              href="/dashboard"
              className={`inline-flex h-10 items-center gap-1.5 rounded-full bg-stone px-4 font-medium text-ink transition-colors hover:bg-stone-dark ${RING}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/dashboard/qr/new"
              className={`group inline-flex h-10 items-center gap-2 rounded-full py-1.5 pl-1 pr-3.5 font-medium text-ink transition-colors hover:bg-stone ${RING}`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white transition-transform group-hover:translate-x-0.5">
                <Plus className="h-4 w-4" aria-hidden />
              </span>
              New QR
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className={`grid h-10 w-10 place-items-center rounded-full text-muted-2 transition-colors hover:bg-stone hover:text-ink ${RING}`}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
