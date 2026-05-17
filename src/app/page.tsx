import Link from "next/link";
import { ArrowRight, BarChart3, Pencil, Globe2 } from "lucide-react";
import LogoMark from "@/components/logo-mark";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight">
              Masaar <span className="text-deep-teal font-arabic">مسار</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/dashboard/qr/new"
              className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta active:bg-terracotta-dark"
            >
              Create QR Code
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-4 py-1 text-xs font-medium uppercase tracking-wider text-gray-700">
          Live tracking · Editable anytime
        </span>
        <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          Every scan has <span className="text-deep-teal">a path.</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-balance text-lg text-gray-600">
          Adaptive dynamic QR codes for GCC businesses. Create, manage, and edit
          destinations in real time — without reprinting.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/dashboard/qr/new"
            className="inline-flex items-center gap-2 rounded-lg bg-deep-teal px-6 py-3 text-base font-semibold text-white hover:bg-terracotta active:bg-terracotta-dark"
          >
            Create QR Code <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="rounded-lg border border-gray-200 px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Pencil className="h-6 w-6" />}
            title="Edit after printing"
            body="Dynamic QRs point to your Masaar link. Change the destination URL anytime without reprinting."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Real-time analytics"
            body="See every scan as it happens — location, device, browser, time of day."
          />
          <FeatureCard
            icon={<Globe2 className="h-6 w-6" />}
            title="Built for GCC"
            body="Arabic-first UI, Saudi data centres ready, riyal-friendly pricing in v2."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Masaar مسار. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-deep-teal/10 text-deep-teal">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}
