import Link from "next/link";
import { LayoutDashboard, Plus, LogOut } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-[#F6F4EE]">
      <header className="border-b border-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="font-bold tracking-tight">
              Masaar <span className="text-deep-teal font-arabic">مسار</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-charcoal/75 hover:bg-sand-light"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/qr/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-deep-teal px-3 py-1.5 font-semibold text-white hover:bg-deep-teal-dark transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              New QR
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-charcoal/75 hover:bg-sand-light"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
