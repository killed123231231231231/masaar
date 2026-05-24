import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Globe,
  Languages,
  Layers,
  MapPin,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";
import HeaderLoginButton from "@/components/header-login-button";
import HeaderProfileMenu from "@/components/header-profile-menu";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NAV = [
  { label: "Product", href: "/product" },
  { label: "Solutions", href: "/solutions" },
  { label: "Resources", href: "/resources" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

const TRUST_LOGOS = [
  "Nexora",
  "Alvora",
  "Midaar",
  "Qahwati",
  "Syhera",
  "Hilal",
];

export default async function LandingPage() {
  // B5/Item 13 (partial) — SiteHeader is now auth-aware. Fetch the
  // session server-side and pass auth state down as props. The Phase 2
  // commit (Item 12) will swap the read-only avatar chip for a real
  // profile dropdown (Settings / Sign out).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const userEmail = user?.email ?? null;

  return (
    <main className="min-h-screen bg-white text-charcoal">
      <SiteHeader isAuthed={isAuthed} userEmail={userEmail} />

      <Hero />
      <TrustStrip />

      <HowItWorks />
      <FeaturesGrid />
      <BuiltInRiyadh />
      <BuiltForGCC />
      {/* FAQ section removed from landing per B5/Item 4. The Faq component
          stays defined below so it can be reused on /pricing later. */}
      <FinalCta />

      <SiteFooter />
    </main>
  );
}

/* ------------------------------------------------------------------ */

function SiteHeader({
  isAuthed,
  userEmail,
}: {
  isAuthed: boolean;
  userEmail: string | null;
}) {
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
              {/* B5/Item 13 completion — the read-only chip is now a real
                  dropdown (Dashboard / Settings / Sign out) mirroring the
                  sidebar's ProfileChip. */}
              <HeaderProfileMenu email={userEmail} />
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
  );
}

/* ────────────────────────────── HERO ────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F6F4EE]">
      <HeroBackdrop />
      {/* B5/Fix 24 — pull the hero content up so it doesn't float in
          a sea of cream below the header. Was pt-12 / lg:pt-20; now
          pt-6 / lg:pt-10 closes the gap. Bottom padding kept generous
          so the TrustStrip below still has breathing room. */}
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-6 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14 lg:pt-10 lg:pb-20">
        <HeroCopy />
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
      <div className="absolute -right-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-deep-teal/10 blur-3xl" />
      <div className="absolute -left-32 top-48 h-80 w-80 rounded-full bg-terracotta/10 blur-3xl" />
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="relative z-10">
      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-deep-teal">
        <Sparkles className="h-3.5 w-3.5 text-deep-teal-light" strokeWidth={2.25} />
        Adaptive QR platform
      </span>

      <h1 className="mt-5 text-balance font-display text-[2.4rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
        Adaptive dynamic <br className="hidden sm:block" />
        QR codes for{" "}
        <span className="italic text-deep-teal">GCC businesses</span>
      </h1>

      <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-charcoal/65">
        Create, manage, and optimize dynamic QR experiences with real-time
        scan analytics — so every scan drives measurable impact.
      </p>

      <div className="mt-7 inline-flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white/60 px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-deep-teal text-white">
          <LogoMark className="h-5 w-5 brightness-0 invert" />
        </span>
        <span className="text-sm font-medium text-charcoal/75">
          Every scan has a path.
        </span>
      </div>

      <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-teal px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark"
        >
          Create QR Code <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-lg border border-charcoal/15 bg-white px-6 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-sand-light hover:text-deep-teal"
        >
          Book a demo
        </Link>
      </div>

      <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-charcoal/55">
        <li className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-deep-teal" strokeWidth={2.5} />
          No credit card required
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-deep-teal" strokeWidth={2.5} />
          Setup in minutes
        </li>
      </ul>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative z-10 w-full">
      {/* Dashboard browser-frame card */}
      <div className="relative rounded-2xl border border-charcoal/10 bg-white p-2 shadow-[0_30px_60px_-20px_rgba(15,91,85,0.25)] sm:p-2.5">
        <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta/55" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-dark" />
          <span className="h-2.5 w-2.5 rounded-full bg-deep-teal/35" />
          <span className="ml-3 hidden text-[10px] font-medium text-charcoal/40 sm:inline">
            masaar.app / dashboard
          </span>
        </div>
        <div className="overflow-hidden rounded-xl">
          <Image
            src="/landing/dashboard-preview.png"
            alt="Masaar dashboard preview — account-wide scan analytics, KPI row, trend chart, and recent activity"
            width={1672}
            height={941}
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="h-auto w-full"
          />
        </div>
      </div>

      {/* Phone mock — menu QR-scan result, bottom-left */}
      <div className="pointer-events-none absolute -bottom-6 -left-3 hidden w-40 rotate-[-4deg] sm:block lg:-bottom-10 lg:-left-8 lg:w-44">
        <div className="rounded-[1.75rem] border-[5px] border-charcoal bg-charcoal p-1 shadow-2xl shadow-charcoal/25">
          <div className="overflow-hidden rounded-[1.35rem] bg-white">
            <div className="flex items-center justify-center gap-1.5 bg-deep-teal py-1.5">
              <LogoMark className="h-3.5 w-3.5 brightness-0 invert" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/90">
                Menu
              </span>
            </div>
            <div className="space-y-1.5 p-3">
              <p className="text-[10px] font-display font-bold text-charcoal">
                Today’s specials
              </p>
              {[
                { name: "Saffron risotto", price: 68 },
                { name: "Grilled hammour", price: 84 },
                { name: "Karak tea", price: 18 },
              ].map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between border-b border-charcoal/5 pb-1 text-[9px] text-charcoal/65 last:border-b-0"
                >
                  <span>{d.name}</span>
                  <span className="font-semibold text-charcoal">SAR {d.price}</span>
                </div>
              ))}
              <div className="mt-2 rounded-md bg-deep-teal py-1 text-center text-[9px] font-semibold text-white">
                Order now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signage card — bottom-right, "Luxury Lifestyle of the Sea" */}
      <div className="pointer-events-none absolute -bottom-4 right-2 hidden w-44 rotate-[4deg] sm:block lg:-bottom-8 lg:-right-4 lg:w-52">
        <div className="rounded-xl border border-charcoal/10 bg-white p-3 text-center shadow-xl shadow-charcoal/15">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-terracotta">
            View our menu
          </p>
          <MiniQr className="mx-auto mt-2 h-16 w-16" />
          <p className="mt-2 font-display text-[10px] font-semibold leading-tight text-charcoal">
            Luxury Lifestyle of the Sea
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-wider text-charcoal/45">
            Scan to explore
          </p>
        </div>
      </div>
    </div>
  );
}

/* Tiny decorative QR block — fixed pattern, not scannable. */
const MINI_QR_PATTERN = [
  "111111100101111111",
  "100000101001000001",
  "101110101001011101",
  "101110100101011101",
  "101110101101011101",
  "100000100001000001",
  "111111101011111111",
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

function MiniQr({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`grid aspect-square gap-px ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(18, minmax(0, 1fr))` }}
    >
      {MINI_QR_PATTERN.flatMap((row, y) =>
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

/* ───────────────────────── TRUST STRIP ───────────────────────── */

function TrustStrip() {
  return (
    <div className="border-y border-charcoal/10 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
          Trusted by forward-thinking businesses
        </p>
        <ul className="mt-6 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {TRUST_LOGOS.map((name) => (
            <li
              key={name}
              className="flex flex-col items-center gap-1 text-charcoal/40 transition-colors hover:text-charcoal/65"
            >
              <span className="font-display text-base font-bold uppercase tracking-[0.18em]">
                {name}
              </span>
              <span className="text-[9px] font-medium uppercase tracking-widest text-charcoal/30">
                Example
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// B6/Section 3 — chip-row pattern borrowed from getqr's 3-step explainer:
// each card carries a small "what this looks like" chip strip above the
// numbered marker. Chips preview the concrete primitives (content types
// / customization knobs / export formats) so the visitor understands what
// gets selected at each step before clicking into the wizard.
const STEPS = [
  {
    icon: QrCode,
    title: "Create your code",
    body: "Generate a dynamic QR in seconds — add your logo, brand colors, and a destination URL.",
    chips: ["Website", "Menu", "WhatsApp", "vCard", "WiFi"],
  },
  {
    icon: Printer,
    title: "Print & deploy",
    body: "Put it on packaging, signage, or menus. The printed code never changes.",
    chips: ["Colors", "Logo", "Frame", "Styles"],
  },
  {
    icon: RefreshCw,
    title: "Track & adapt",
    body: "Watch scans live and re-point the destination anytime — no reprint, no downtime.",
    chips: ["PNG", "SVG", "JPG", "Print-ready"],
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
        {STEPS.map(({ icon: Icon, title, body, chips }, i) => (
          <li
            key={title}
            className="relative rounded-2xl border border-charcoal/10 bg-white p-7"
          >
            <span className="absolute right-6 top-6 font-display text-4xl font-bold text-sand">
              {i + 1}
            </span>
            {/* Chip strip — preview the concrete choices made at this step.
                Wraps on narrow cards; the visual signal is "this is what's
                under the hood at step N". */}
            <ul className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-charcoal/10 bg-sand-light/60 px-2.5 py-0.5 text-[11px] font-medium text-charcoal/70"
                >
                  {c}
                </li>
              ))}
            </ul>
            <span className="mt-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-deep-teal/10 text-deep-teal">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// B6/Section 4 — 5-Feature Grid (NEW).
//
// Replaces the old AnalyticsPreview section. Borrows getqr.com's
// `lg:grid-cols-5` icon+h3+body card pattern as the dominant
// "what you get" visual primitive on the landing, but every feature
// here is Masaar-specific (GCC content types, bilingual Arabic, AI
// Menu) — none are copied from getqr's generic 5.
//
// Two features carry honest "Coming soon" badges (Bilingual + AI
// Menu). Per STRATEGY.md and the brand-discipline guardrails, no
// roadmap item is shipped as "live" before its session lands.
const LANDING_FEATURES = [
  {
    icon: RefreshCw,
    title: "Dynamic destinations",
    body:
      "Edit where a printed QR points — anytime, no reprint, no downtime. The code on your packaging stays good for the life of the campaign.",
    soon: false,
  },
  {
    icon: Layers,
    title: "GCC content types",
    body:
      "Website, Menu, WhatsApp, vCard, WiFi, App Link, and more — tuned for how Saudi customers actually engage. WhatsApp deep-links and Menu primitives ship by default.",
    soon: false,
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    body:
      "Riyadh-time scan trends, country + city + device breakdowns, hashed-IP unique counts. Every scan is a data point in your dashboard within seconds.",
    soon: false,
  },
  {
    icon: Languages,
    title: "Bilingual Arabic / English",
    body:
      "Native RTL, IBM Plex Arabic typography, and bilingual hosted pages built for GCC scanners on the first tap — not translated as an afterthought.",
    soon: true,
  },
  {
    icon: UtensilsCrossed,
    title: "AI Menu Builder",
    body:
      "Upload a photo of your paper menu — Claude Vision extracts categories, items, prices, allergens, and bilingual fields in seconds. Built for Saudi cafes from day one.",
    soon: true,
  },
];

function FeaturesGrid() {
  return (
    <section className="bg-sand-light/60">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal">
            What's in the box
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            More than a QR generator
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-charcoal/65">
            Five capabilities most generators don't ship — built around how
            GCC businesses actually use QR codes day to day.
          </p>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {LANDING_FEATURES.map(({ icon: Icon, title, body, soon }) => (
            <li
              key={title}
              className="relative rounded-2xl border border-charcoal/10 bg-white p-6 transition-colors hover:border-deep-teal/30"
            >
              {soon && (
                <span className="absolute right-4 top-4 rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-terracotta-dark">
                  Soon
                </span>
              )}
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-deep-teal/10 text-deep-teal">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-display text-base font-bold leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// B6/Section 5 — "Built in Riyadh" positioning block (NEW).
//
// Replaces the testimonial slot per the approved B.6 mapping. We do
// NOT ship fake "Example"-labeled customer quotes — GCC competitors
// like getqr have 1,415 real Reviews.io entries and trying to match
// scale theater would feel weaker than honest scarcity. Instead we
// turn the absence of customer wins into a positioning statement:
// Masaar is new, built for the GCC market, and the roadmap is honest.
//
// Real testimonials = Sprint 3 task after 5-10 actual GCC wins land.
// Until then this section carries the brand/origin/mission narrative.
function BuiltInRiyadh() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="grid items-center gap-10 rounded-3xl border border-charcoal/10 bg-sand-light/40 p-10 lg:grid-cols-[1.3fr_1fr] lg:p-14">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-deep-teal">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} />
            Built in Riyadh
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            QR tools made for the GCC, not adapted from US software.
          </h2>
          <p className="mt-5 text-balance text-base leading-relaxed text-charcoal/70">
            Most QR platforms are priced in dollars, designed for Western
            customers, and bolt on Arabic as an afterthought. Masaar is the
            alternative — Saudi-priced, GCC-aware by default, and built
            around the content types that actually matter here:{" "}
            <span className="font-medium text-charcoal">menu, WhatsApp,
            vCard, WiFi, location</span>.
          </p>
          <p className="mt-3 text-balance text-base leading-relaxed text-charcoal/70">
            We&apos;re launching in 2026 with the Saudi F&amp;B and retail
            market in mind. Honest about what&apos;s live versus what&apos;s
            on the way — no &ldquo;coming soon&rdquo; vapor that never ships.
          </p>

          {/* Roadmap teaser — three concrete next bets, honest about
              when. Pulls from STRATEGY.md §2.1 + the sprint plan. */}
          <ul className="mt-7 grid gap-3 sm:grid-cols-3">
            <RoadmapPill label="Mada / STC Pay" when="Sprint 3" />
            <RoadmapPill label="Arabic + RTL" when="Next session" />
            <RoadmapPill label="Menu vertical" when="Launching next" />
          </ul>
        </div>

        {/* Right: visual anchor — stylized Arabian peninsula with
            Riyadh pinned. Decorative; not interactive. Brand palette
            only, no third-party map tiles (and no IP geolocation calls
            from this client — landing is anon and we don't hit
            geo services from the public marketing surface). */}
        <div className="relative mx-auto w-full max-w-sm">
          <PeninsulaPin />
          <div className="pointer-events-none absolute -bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-charcoal/10 bg-white px-4 py-2 shadow-sm">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-deep-teal text-white">
              <LogoMark className="h-3.5 w-3.5 brightness-0 invert" />
            </span>
            <span className="text-xs font-semibold text-charcoal">
              Masaar <span className="font-arabic text-deep-teal">مسار</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapPill({ label, when }: { label: string; when: string }) {
  return (
    <li className="rounded-lg border border-charcoal/10 bg-white px-3 py-2.5">
      <p className="text-sm font-semibold text-charcoal">{label}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-charcoal/50">
        {when}
      </p>
    </li>
  );
}

// Decorative stylized Arabian peninsula. Hand-drawn SVG path
// (approximate — meant to be a visual anchor, not geographically
// strict). Riyadh marked with a deep-teal pin + soft pulse. Saudi
// + GCC-neighbor outlines hinted at via the silhouette so a GCC
// viewer recognizes the shape without it reading as a literal map.
function PeninsulaPin() {
  return (
    <svg
      viewBox="0 0 220 240"
      className="h-auto w-full"
      aria-label="Stylized Arabian peninsula with Riyadh marked"
      role="img"
    >
      {/* Peninsula silhouette — simplified contour */}
      <path
        d="M40 30 Q70 18 100 22 Q140 28 165 50 Q185 75 188 110 Q190 145 175 175 Q160 200 130 215 Q100 226 75 218 Q52 210 42 188 Q30 168 32 138 Q34 100 38 70 Q40 50 40 30 Z"
        fill="#0F5B55"
        fillOpacity="0.08"
        stroke="#0F5B55"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {/* Subtle interior hint — desert texture via sparse dots */}
      {[
        [70, 60], [95, 50], [115, 75], [135, 95], [80, 100],
        [105, 120], [145, 140], [90, 150], [120, 170], [70, 180],
        [155, 80], [60, 130], [130, 50], [165, 130],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="1.4"
          fill="#0F5B55"
          fillOpacity="0.15"
        />
      ))}
      {/* Riyadh pin — center-east of the peninsula */}
      <g transform="translate(108, 105)">
        <circle r="14" fill="#0F5B55" fillOpacity="0.12">
          <animate
            attributeName="r"
            from="14"
            to="20"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="fill-opacity"
            from="0.18"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="6" fill="#0F5B55" />
        <circle r="2" fill="#FFFFFF" />
      </g>
      <text
        x="108"
        y="135"
        textAnchor="middle"
        className="font-display"
        style={{
          fontSize: "12px",
          fontWeight: 700,
          fill: "#1B1B1D",
        }}
      >
        Riyadh
      </text>
      <text
        x="108"
        y="148"
        textAnchor="middle"
        style={{
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fill: "#1B1B1D",
          opacity: 0.55,
        }}
      >
        Saudi Arabia
      </text>
    </svg>
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
      { label: "Contact", href: "/contact" },
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
