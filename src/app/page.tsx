import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  CalendarDays,
  Plane,
  Stethoscope,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";

const NAV = ["Product", "Solutions", "Resources", "Pricing", "About"];

const INDUSTRIES = [
  { icon: ShoppingBag, label: "Retail" },
  { icon: UtensilsCrossed, label: "Hospitality" },
  { icon: Building2, label: "Real estate" },
  { icon: CalendarDays, label: "Events" },
  { icon: Plane, label: "Travel" },
  { icon: Stethoscope, label: "Healthcare" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-charcoal">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroBackdrop />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-24 lg:pb-28">
          {/* Left — copy */}
          <div className="relative z-10 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-deep-teal/20 bg-deep-teal/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-deep-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
              Adaptive QR platform
            </span>

            <h1 className="mt-6 text-balance font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Adaptive dynamic QR codes for{" "}
              <span className="text-deep-teal">GCC businesses</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-charcoal/70 lg:mx-0">
              Create, manage, and optimize QR codes that adapt in real time.
              One scan, infinite possibilities.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/60">
              <LogoMark className="h-5 w-5" />
              Every scan has a path.
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-deep-teal px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark sm:w-auto"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex w-full items-center justify-center rounded-lg border border-charcoal/15 px-6 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-sand-light hover:text-deep-teal sm:w-auto"
              >
                Book a demo
              </Link>
            </div>

            <p className="mt-5 text-xs text-charcoal/50">
              No credit card required · Setup in 1 minute
            </p>
          </div>

          {/* Right — faked product visuals (all static SVG / divs) */}
          <div className="relative z-10 mx-auto w-full max-w-md lg:max-w-none">
            <DashboardMock />
            <PhoneMock />
            <SignageMock />
          </div>
        </div>

        {/* Industries strip */}
        <div className="border-t border-charcoal/10 bg-sand-light/60">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-charcoal/45">
              Trusted by forward-thinking businesses
            </p>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-charcoal/55">
              {INDUSTRIES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-sm font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/* ------------------------------------------------------------------ */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight">
            Masaar <span className="font-arabic text-deep-teal">مسار</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item}
              href="#"
              className="text-sm font-medium text-charcoal/70 transition-colors hover:text-deep-teal"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:text-deep-teal sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
      <div className="absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-deep-teal/8 blur-3xl" />
      <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-terracotta/8 blur-3xl" />
      <svg
        className="absolute inset-x-0 bottom-0 h-40 w-full text-deep-teal/[0.04]"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,96 C240,160 480,32 720,64 C960,96 1200,160 1440,96 L1440,160 L0,160 Z" />
      </svg>
    </div>
  );
}

/* Faked analytics dashboard — static SVG + divs, no chart library. */
function DashboardMock() {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white shadow-xl shadow-charcoal/5">
      <div className="flex items-center gap-1.5 border-b border-charcoal/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-terracotta/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-sand-dark" />
        <span className="h-2.5 w-2.5 rounded-full bg-deep-teal/40" />
        <span className="ml-3 text-xs font-medium text-charcoal/40">
          masaar.app / overview
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">Overview</h3>
          <span className="rounded-md bg-deep-teal/10 px-2 py-0.5 text-[10px] font-semibold text-deep-teal">
            Last 30 days
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Total scans" value="18,739" />
          <Kpi label="Unique" value="12,451" />
          <Kpi label="Scan rate" value="68.2%" />
        </div>

        {/* Static area chart */}
        <div className="rounded-xl border border-charcoal/10 bg-sand-light/40 p-3">
          <svg
            viewBox="0 0 320 120"
            className="h-28 w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,98 L26,86 L52,92 L78,64 L104,74 L130,50 L156,58 L182,36 L208,46 L234,26 L260,34 L286,18 L320,24 L320,120 L0,120 Z"
              fill="#0F5B55"
              fillOpacity="0.12"
            />
            <path
              d="M0,98 L26,86 L52,92 L78,64 L104,74 L130,50 L156,58 L182,36 L208,46 L234,26 L260,34 L286,18 L320,24"
              fill="none"
              stroke="#0F5B55"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Region split */}
        <div className="flex items-center gap-4 rounded-xl border border-charcoal/10 p-3">
          <Donut percent={64} />
          <div className="flex-1 space-y-2">
            <RegionRow label="Saudi Arabia" pct={64} />
            <RegionRow label="UAE" pct={24} />
            <RegionRow label="Qatar" pct={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-charcoal/45">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-charcoal">
        {value}
      </p>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = (percent / 100) * c;
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#E9E6DF" strokeWidth="9" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#0F5B55"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`}
      />
    </svg>
  );
}

function RegionRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-charcoal/70">{label}</span>
        <span className="text-charcoal/45">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-deep-teal"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* Decorative QR — a fixed pattern, not a scannable code. */
const QR_PATTERN = [
  "111111101011111110",
  "100000101101000010",
  "101110100110111010",
  "101110101010111010",
  "101110100010111010",
  "100000101110000010",
  "111111101011111110",
  "000000001100000000",
  "110101110011010110",
  "001011001100101100",
  "110010101011001010",
  "001101100110110010",
  "111010011001011010",
  "000000001011101100",
  "111111101100110010",
  "100000100110101100",
  "101110101011011010",
  "101110100100110110",
];

function FakeQr({ className }: { className?: string }) {
  return (
    <div
      className={`grid aspect-square gap-px ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(18, minmax(0, 1fr))` }}
      aria-hidden
    >
      {QR_PATTERN.flatMap((row, y) =>
        row.split("").map((cell, x) => (
          <span
            key={`${x}-${y}`}
            className={cell === "1" ? "bg-charcoal" : "bg-transparent"}
          />
        ))
      )}
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="absolute -bottom-10 left-1/2 w-40 -translate-x-1/2 sm:left-4 sm:-translate-x-0 lg:-bottom-12 lg:-left-10">
      <div className="rounded-[1.75rem] border-[5px] border-charcoal bg-charcoal p-1 shadow-2xl shadow-charcoal/20">
        <div className="overflow-hidden rounded-[1.35rem] bg-white">
          <div className="flex items-center justify-center bg-deep-teal py-2">
            <LogoMark className="h-4 w-4 brightness-0 invert" />
          </div>
          <div className="space-y-3 p-4 text-center">
            <FakeQr className="mx-auto w-24" />
            <p className="text-[11px] font-semibold text-charcoal">
              Scan to continue
            </p>
            <div className="rounded-md bg-deep-teal py-1.5 text-[10px] font-semibold text-white">
              Open link
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignageMock() {
  return (
    <div className="absolute -right-4 -top-8 hidden w-36 rotate-3 rounded-xl border border-charcoal/10 bg-white p-3 text-center shadow-lg shadow-charcoal/10 sm:block lg:-right-8">
      <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta">
        Scan me
      </p>
      <FakeQr className="mx-auto mt-2 w-20" />
      <p className="mt-2 text-[9px] font-medium text-charcoal/55">
        Every scan has a path.
      </p>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/10">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-charcoal/50">
        © {new Date().getFullYear()} Masaar{" "}
        <span className="font-arabic">مسار</span>. All rights reserved.
      </div>
    </footer>
  );
}
