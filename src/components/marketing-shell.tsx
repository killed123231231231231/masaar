import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import HeaderLoginButton from "@/components/header-login-button";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for the remaining marketing surface (/pricing only
// after the B6 pivot collapsed /about /product /solutions /resources
// into landing-anchor redirects). Server component with auth state
// fetched per-render so the header mirrors the landing's auth-aware
// pattern from Fix 13 — anon visitors see Log in + Create QR Code,
// logged-in visitors see Dashboard link + Create QR Code + avatar chip.
//
// B5/Round2 H3 — was previously a single "Create QR" pill with no Log
// in affordance, leaving authed users stranded on marketing pages
// without a fast way back to their dashboard.
//
// B6 pivot — header nav now matches the landing's 4-anchor pattern
// (Features / Pricing / GCC / FAQ) so a visitor jumping between
// /pricing and the landing sees consistent navigation. Anchors are
// prefixed with `/` so they always route back to the landing first.
//
// `intro` accepts a string OR a React node (for richer hero copy /
// inline toggles on the pricing page). `wide` switches max-w from
// 3xl to 7xl for layouts that need horizontal breathing room
// (e.g. 5-tier pricing matrix).
const NAV = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "GCC", href: "/#gcc" },
  { label: "FAQ", href: "/#faq" },
];

export default async function MarketingShell({
  title,
  intro,
  children,
  wide = false,
}: {
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const userEmail = user?.email ?? null;
  const initial = (userEmail?.[0] ?? "U").toUpperCase();
  const maxW = wide ? "max-w-7xl" : "max-w-3xl";

  return (
    <main className="min-h-screen bg-white text-charcoal">
      <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">
              Masaar <span className="font-arabic text-deep-teal">مسار</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-charcoal/70 transition-colors hover:text-deep-teal"
              >
                {item.label}
              </Link>
            ))}
          </nav>
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

      <section className={`mx-auto ${maxW} px-6 py-12 lg:py-16`}>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {intro && (
          <div className="mt-4 text-lg leading-relaxed text-charcoal/70">
            {intro}
          </div>
        )}
        {children && (
          <div className="mt-8 space-y-6 text-base leading-relaxed text-charcoal/70">
            {children}
          </div>
        )}
      </section>
    </main>
  );
}
