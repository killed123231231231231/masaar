import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import HeaderLoginButton from "@/components/header-login-button";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for the one-screen marketing pages (/about, /pricing,
// /product, /solutions, /resources). Server component with auth state
// fetched per-render so the header mirrors the landing's auth-aware
// pattern from Fix 13 — anon visitors see Log in + Create QR Code,
// logged-in visitors see Dashboard link + Create QR Code + avatar chip.
//
// B5/Round2 H3 — was previously a single "Create QR" pill with no Log
// in affordance, leaving authed users stranded on marketing pages
// without a fast way back to their dashboard.
export default async function MarketingShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const userEmail = user?.email ?? null;
  const initial = (userEmail?.[0] ?? "U").toUpperCase();

  return (
    <main className="min-h-screen bg-white text-charcoal">
      <header className="border-b border-charcoal/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">
              Masaar <span className="font-arabic text-deep-teal">مسار</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden px-3 py-2 text-sm font-medium text-charcoal/75 transition-colors hover:text-deep-teal sm:inline-block"
                >
                  Dashboard
                </Link>
                <Link
                  href="/create"
                  className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark"
                >
                  Create QR Code
                </Link>
                <span
                  title={userEmail ?? undefined}
                  aria-label={userEmail ? `Signed in as ${userEmail}` : "Signed in"}
                  className="grid h-9 w-9 place-items-center rounded-full bg-deep-teal text-xs font-bold uppercase text-white"
                >
                  {initial}
                </span>
              </>
            ) : (
              <>
                <HeaderLoginButton />
                <Link
                  href="/create"
                  className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark"
                >
                  Create QR Code
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">
            {intro}
          </p>
        )}
        {children && (
          <div className="mt-8 space-y-4 text-base leading-relaxed text-charcoal/70">
            {children}
          </div>
        )}
        <Link
          href="/"
          className="mt-12 inline-block text-sm font-semibold text-deep-teal hover:underline"
        >
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
