import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import CreateClient from "./create-client";

// Public, no auth (middleware only gates /dashboard). The anonymous
// funnel entry point — slim branded chrome, no DashboardShell.
export default function CreatePage() {
  return (
    <main className="min-h-screen bg-sand-light/40">
      <header className="border-b border-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-lg font-bold text-charcoal">
              Masaar
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-charcoal/65 transition-colors hover:text-deep-teal"
          >
            Log in
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
            Create your QR code
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Build it now — no account needed. We’ll email it to you.
          </p>
        </div>
        <CreateClient />
      </div>
    </main>
  );
}
