import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  CalendarDays,
  Plane,
  Stethoscope,
  QrCode,
  Printer,
  RefreshCw,
  Activity,
  MapPin,
  Pencil,
  ChevronDown,
  Languages,
  ShieldCheck,
  Globe,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";

const NAV = [
  { label: "Product", href: "/product" },
  { label: "Solutions", href: "/solutions" },
  { label: "Resources", href: "/resources" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

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
                href="/create"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-deep-teal px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark sm:w-auto"
              >
                Create yours now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex w-full items-center justify-center rounded-lg border border-charcoal/15 px-6 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-sand-light hover:text-deep-teal sm:w-auto"
              >
                See how it works
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

      <HowItWorks />
      <AnalyticsPreview />
      <BuiltForGCC />
      <Faq />
      <FinalCta />

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
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-charcoal/70 transition-colors hover:text-deep-teal"
            >
              {item.label}
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
            href="/create"
            className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark"
          >
            Create QR
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

const STEPS = [
  {
    icon: QrCode,
    title: "Create your code",
    body: "Generate a dynamic QR in seconds — add your logo, brand colors, and a destination URL.",
  },
  {
    icon: Printer,
    title: "Print & deploy",
    body: "Put it on packaging, signage, or menus. The printed code never changes.",
  },
  {
    icon: RefreshCw,
    title: "Track & adapt",
    body: "Watch scans live and re-point the destination anytime — no reprint, no downtime.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal">
          How it works
        </p>
        <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
          One code. Endless destinations.
        </h2>
        <p className="mt-4 text-balance text-base leading-relaxed text-charcoal/65">
          Print once, change forever. Masaar separates the code from where it
          points, so a campaign can evolve without a single reprint.
        </p>
      </div>

      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li
            key={title}
            className="relative rounded-2xl border border-charcoal/10 bg-white p-7"
          >
            <span className="absolute right-6 top-6 font-display text-4xl font-bold text-sand">
              {i + 1}
            </span>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-deep-teal/10 text-deep-teal">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const ANALYTICS_POINTS = [
  {
    icon: Activity,
    title: "Live scan feed",
    body: "Every scan lands in your dashboard within seconds — no polling, no delay.",
  },
  {
    icon: MapPin,
    title: "Geo & device breakdown",
    body: "Country, city, browser, and OS for every scan, aggregated automatically.",
  },
  {
    icon: Pencil,
    title: "Editable destinations",
    body: "A/B a landing page or fix a broken link in production — instantly.",
  },
];

/* Static analytics visual — hand-written SVG bars + trend line. */
function AnalyticsPreview() {
  const bars = [38, 52, 44, 70, 60, 86, 74];
  return (
    <section className="bg-sand-light/60">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal">
            Real-time analytics
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            See every scan as it happens
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-charcoal/65">
            Stop guessing what your printed campaigns do. Masaar turns each
            scan into a data point you can act on the same minute.
          </p>

          <ul className="mt-8 space-y-5">
            {ANALYTICS_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-deep-teal/10 text-deep-teal">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal/65">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-xl shadow-charcoal/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal/45">
                Scans this week
              </p>
              <p className="mt-1 font-display text-3xl font-bold">4,218</p>
            </div>
            <span className="rounded-md bg-deep-teal/10 px-2.5 py-1 text-xs font-semibold text-deep-teal">
              ▲ 23%
            </span>
          </div>

          <svg
            viewBox="0 0 320 160"
            className="mt-6 h-44 w-full"
            preserveAspectRatio="none"
          >
            {bars.map((h, i) => {
              const x = 14 + i * 44;
              const barH = (h / 100) * 130;
              return (
                <rect
                  key={i}
                  x={x}
                  y={140 - barH}
                  width="26"
                  height={barH}
                  rx="4"
                  fill="#0F5B55"
                  fillOpacity={i === bars.length - 1 ? "1" : "0.28"}
                />
              );
            })}
            <path
              d="M27,96 L71,76 L115,86 L159,52 L203,62 L247,28 L291,40"
              fill="none"
              stroke="#E07A5F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-charcoal/10 pt-4 text-center">
            <Stat label="Countries" value="14" />
            <Stat label="Avg / day" value="602" />
            <Stat label="Peak hour" value="8 PM" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-charcoal/45">
        {label}
      </p>
    </div>
  );
}

const GCC_FEATURES = [
  { icon: Languages, en: "Arabic-first UI", ar: "واجهة عربية أولاً" },
  { icon: ShieldCheck, en: "Regional data residency", ar: "استضافة بيانات إقليمية" },
  { icon: Globe, en: "Gulf-ready pricing", ar: "تسعير مهيّأ للخليج" },
];

function BuiltForGCC() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="overflow-hidden rounded-3xl bg-deep-teal text-white">
        <div className="grid gap-10 p-10 md:grid-cols-2 lg:p-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal-light">
              Built for the Gulf
            </p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Designed for the GCC, in your language
            </h2>
            <p className="mt-4 text-balance leading-relaxed text-white/75">
              Arabic-first interface, regional data residency, and pricing
              that speaks your market — for businesses across Saudi Arabia,
              the UAE, and the wider Gulf.
            </p>
          </div>

          <div dir="rtl" className="font-arabic text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal-light">
              مصمّم لمنطقة الخليج
            </p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-snug sm:text-4xl">
              مصمّم لدول الخليج، وبلغتك
            </h2>
            <p className="mt-4 text-balance leading-loose text-white/75">
              واجهة عربية أولاً، واستضافة بيانات إقليمية، وأسعار تناسب سوقك —
              للشركات في السعودية والإمارات ومنطقة الخليج.
            </p>
          </div>
        </div>

        <div className="grid border-t border-white/15 sm:grid-cols-3">
          {GCC_FEATURES.map(({ icon: Icon, en, ar }) => (
            <div
              key={en}
              className="flex items-center gap-3 px-8 py-5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/15 sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r"
            >
              <Icon className="h-5 w-5 shrink-0 text-deep-teal-light" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{en}</p>
                <p className="font-arabic text-xs text-white/65">{ar}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "What is a dynamic QR code?",
    a: "A QR code whose destination you can change after it's printed. The code points to a Masaar link you control, so the artwork never has to change.",
  },
  {
    q: "Do I need to reprint when the URL changes?",
    a: "No — that's the whole point. Update the destination in your dashboard and every existing printed code instantly follows.",
  },
  {
    q: "Is Masaar available in Arabic?",
    a: "Yes. The interface is built Arabic-first with full right-to-left support, alongside English.",
  },
  {
    q: "What scan data do I get?",
    a: "Aggregated country, city, device, browser, and timing for every scan — with hashed IPs, never raw addresses or personally identifying information.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Start free with no credit card required, and set up your first code in about a minute.",
  },
];

function Faq() {
  return (
    <section className="bg-sand-light/60">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal">
            FAQ
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-12 divide-y divide-charcoal/10 border-y border-charcoal/10">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-charcoal/50 transition-transform group-open:rotate-180"
                  strokeWidth={2}
                />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-charcoal/65">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 lg:pb-28">
      <div className="rounded-3xl border border-charcoal/10 bg-sand-light px-8 py-14 text-center lg:px-16 lg:py-16">
        <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to give every scan a path?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-charcoal/65">
          Create your first dynamic QR code in about a minute. No credit card,
          no reprints, ever.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-deep-teal px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark sm:w-auto"
          >
            Create yours now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center rounded-lg border border-charcoal/15 bg-white px-6 py-3 text-base font-semibold text-charcoal transition-colors hover:text-deep-teal sm:w-auto"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Create a QR", href: "/create" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Solutions", href: "/solutions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides & docs", href: "/resources" },
      { label: "Log in", href: "/login" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/10 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <LogoMark className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight">
                Masaar <span className="font-arabic text-deep-teal">مسار</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal/55">
              Adaptive dynamic QR codes for GCC businesses. Every scan has a
              path.
            </p>
          </div>

          {FOOTER_COLS.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-charcoal/55 transition-colors hover:text-deep-teal"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-charcoal/10 pt-6 text-sm text-charcoal/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Masaar{" "}
            <span className="font-arabic">مسار</span>. All rights reserved.
          </p>
          <p>Built for the GCC</p>
        </div>
      </div>
    </footer>
  );
}
