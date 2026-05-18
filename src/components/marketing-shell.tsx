import Link from "next/link";
import LogoMark from "@/components/logo-mark";

// Minimal shared chrome for the one-screen marketing/nav pages. Server
// component, brand typography, no design exercise (spec §10).
export default function MarketingShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
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
          <Link
            href="/create"
            className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-terracotta"
          >
            Create QR
          </Link>
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
