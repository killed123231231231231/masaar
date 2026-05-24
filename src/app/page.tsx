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

// B6 pivot — header nav reduced to 4 anchor-scroll items mapping to
// real sections on this landing. Dropped Product / Solutions /
// Resources / About — single-page funnel doesn't need a sub-page
// sprawl, and getqr's analysis shows even they get away with zero
// header nav. We keep four so a returning visitor can jump to
// pricing / FAQ without scrolling, but every link lands within the
// same page. Sub-page routes (/product etc.) are server-side
// redirected to the relevant anchor in next.config.ts (commit C).
const NAV = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "GCC", href: "#gcc" },
  { label: "FAQ", href: "#faq" },
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
      <PricingTeaser />
      <BuiltForGCC />
      {/* B6/Section 8 — FAQ reinstated. B5/Item 4 unmounted it pending
          a clean rewrite; this is that rewrite. Questions are GCC-
          relevant (Mada, Arabic, data residency, halal) and explicitly
          NOT mirroring getqr's billing-defensive set (which is 6/13
          questions about cancellation / refunds / "I don't recognize
          this charge" — a symptom of their $1 trial trap). */}
      <Faq />
      {/* B6 pivot — FinalCta removed. Single-page funnel ends FAQ
          → Footer directly (matches getqr's structure). The hero +
          pricing-teaser CTAs already carry the "Create QR Code"
          conversion intent; a trailing "Ready to give every scan a
          path?" was redundant noise at the assembled-landing
          eyeball. */}

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
      className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12 lg:py-16"
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

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
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
// B6 pivot — tightened to 1-2 short lines per card. Getqr's feature
// card density is punchy and scannable; the previous 4-6 line bodies
// read as manuals. The detail can resurface in /product later if we
// ever build it (for now: redirected to this section).
const LANDING_FEATURES = [
  {
    icon: RefreshCw,
    title: "Dynamic destinations",
    body: "Re-point a printed QR anytime. No reprint, no downtime.",
    soon: false,
  },
  {
    icon: Layers,
    title: "GCC content types",
    body: "Website, Menu, WhatsApp, vCard, WiFi — built for how Gulf customers actually engage.",
    soon: false,
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    body: "Riyadh-time trends, geo + device breakdowns, hashed-IP privacy.",
    soon: false,
  },
  {
    icon: Languages,
    title: "Bilingual Arabic / English",
    body: "Native RTL, IBM Plex Arabic — not translated as an afterthought.",
    soon: true,
  },
  {
    icon: UtensilsCrossed,
    title: "AI Menu Builder",
    body: "Upload a paper menu photo. AI extracts items, prices, bilingual fields — in seconds.",
    soon: true,
  },
];

function FeaturesGrid() {
  return (
    <section id="features" className="scroll-mt-20 bg-sand-light/60">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
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

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
    // B6 pivot follow-up — inner-card sections (this one + BuiltForGCC)
    // need smaller outer py than plain sections because the rounded
    // card carries its own p-10 / lg:p-14 padding. Pre-fix the gap from
    // last card content to the next section's header read as ~150px
    // even though the section borders were touching (Usama screenshot
    // 3 flag). py-6 lg:py-10 closes the visual gap to ~50px while
    // keeping the card visually delineated by its own border + bg.
    <section id="gcc" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-6 lg:py-10">
      <div className="grid items-center gap-10 rounded-3xl border border-charcoal/10 bg-sand-light/40 p-8 lg:grid-cols-[1.3fr_1fr] lg:p-12">
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

        {/* Right: branded GCC map illustration. Replaces the earlier
            hand-drawn PeninsulaPin SVG (B6 first pivot). The PNG ships
            the Masaar lockup card baked-in at the bottom-left, so no
            overlay chip needed here. next/image handles WebP / AVIF
            conversion + responsive resizing on Vercel; the source is
            ~1.5 MB PNG that should serve at ~150-300 KB after
            optimization. priority=false because below the fold. */}
        <div className="relative mx-auto w-full max-w-md drop-shadow-md">
          <Image
            src="/landing/built-in-riyadh-map.png"
            alt="GCC map showing Masaar QR codes radiating from Riyadh to locations across Saudi Arabia and the wider Gulf"
            width={1448}
            height={1086}
            sizes="(max-width: 768px) 80vw, 36vw"
            className="h-auto w-full"
            priority={false}
          />
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

// B6/Section 6 — Pricing Teaser (NEW).
//
// 3-card preview of the 5-tier table that lives on /pricing (built in
// Phase 4). Borrows getqr's pricing card grid + "Most Popular"
// highlight + "Save X%" badge patterns — but ships HONEST tiers:
//
// - No $1 trial trap (getqr's pattern; their FAQ is 6/13
//   billing-defensive as a result — see design-targets/getqr-analysis.md)
// - Tiers are differentiated by FEATURES, not just billing cadence
// - SAR pricing upfront, no "prices may vary by country" geo-trick
//
// 5 full tiers per STRATEGY.md §5 (Free / Starter / Pro / Menu Pro /
// Menu Pro + Ordering / Agency); this teaser surfaces the 3 most
// representative — Free / Pro (Most Popular) / Menu Pro — and links
// to /pricing for the full comparison matrix.
const PRICING_PREVIEW = [
  {
    name: "Free",
    price: "SAR 0",
    cadence: "forever",
    headline: "Try Masaar with no card.",
    items: [
      "5 dynamic QR codes",
      "Basic scan analytics",
      "PNG / SVG export",
    ],
    cta: "Start free",
    href: "/create",
    badge: null,
  },
  {
    name: "Pro",
    price: "SAR 99",
    cadence: "per month",
    headline: "Everything most businesses need.",
    items: [
      "Unlimited dynamic QRs",
      "Full analytics + CSV export",
      "Logo, colors, frames",
      "15+ content types",
    ],
    cta: "Start free trial",
    href: "/create",
    badge: "Most popular",
  },
  {
    name: "Menu Pro",
    price: "SAR 199",
    cadence: "per month",
    headline: "Built for Saudi cafes + restaurants.",
    items: [
      "Everything in Pro",
      "Menu vertical + AI import",
      "Photo CDN + allergen tags",
      "Bilingual menu rendering",
    ],
    cta: "Explore Menu Pro",
    href: "/solutions",
    badge: null,
  },
];

function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-deep-teal">
            Pricing
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Plans that grow with you
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-charcoal/65">
            SAR-priced, no surprise renewals. Start free, upgrade when scans
            outgrow the limit.
          </p>
        </div>

        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {PRICING_PREVIEW.map((tier) => {
            const isPopular = tier.badge === "Most popular";
            return (
              <li
                key={tier.name}
                className={`relative rounded-2xl border bg-white p-7 ${
                  isPopular
                    ? "border-deep-teal/40 shadow-[0_8px_32px_-12px_rgba(15,91,85,0.18)] lg:-mt-3 lg:mb-3"
                    : "border-charcoal/10"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-deep-teal px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    {tier.badge}
                  </span>
                )}
                <h3 className="font-display text-lg font-bold">{tier.name}</h3>
                <p className="mt-1 text-xs text-charcoal/55">{tier.headline}</p>
                <p className="mt-5">
                  <span className="font-display text-3xl font-bold text-charcoal">
                    {tier.price}
                  </span>
                  <span className="ml-1.5 text-xs text-charcoal/55">
                    {tier.cadence}
                  </span>
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-charcoal/10 pt-5">
                  {tier.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-charcoal/75"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal"
                        strokeWidth={2.5}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isPopular
                      ? "bg-deep-teal text-white hover:bg-deep-teal-dark"
                      : "border border-charcoal/15 text-charcoal hover:bg-sand-light hover:text-deep-teal"
                  }`}
                >
                  {tier.cta}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-deep-teal hover:underline"
          >
            See all plans + the feature matrix
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const GCC_FEATURES = [
  { icon: Languages, en: "Arabic-first UI", ar: "واجهة عربية أولاً" },
  { icon: ShieldCheck, en: "Regional data residency", ar: "استضافة بيانات إقليمية" },
  { icon: Globe, en: "Gulf-ready pricing", ar: "تسعير مهيّأ للخليج" },
];

function BuiltForGCC() {
  return (
    // B6 pivot follow-up — inner-card section gets reduced outer py
    // for the same reason as BuiltInRiyadh (compounding card-internal
    // padding inflates visible gap to next section).
    <section className="mx-auto max-w-6xl px-6 py-6 lg:py-10">
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

// B6/Section 8 — GCC-relevant questions. NOT mirroring getqr's set
// (theirs is 6/13 billing-defensive — see design-targets/getqr-
// analysis.md §3 S7). Anchored on the questions a Saudi cafe owner
// actually asks: language, payments, data residency, halal, edits
// after print, what happens on cancel. Honest about what's live
// versus roadmap — Arabic + Mada are flagged as "coming" with the
// session they ship in.
const FAQS = [
  {
    q: "How is this different from a free QR generator?",
    a: "Free generators give you a static image — print it, and the URL behind it is locked forever. Masaar codes are dynamic: you can re-point the destination anytime, see who scanned where, and add branding without losing the scan trail. The cost difference shows up the first time a printed campaign needs a URL change.",
  },
  {
    q: "Will it work in Arabic?",
    a: "The dashboard already ships in English with brand-correct Arabic typography (IBM Plex Sans Arabic). Full Arabic UI with RTL layout lands in our next session. Hosted scan-landing pages (menu, vCard) support Arabic + English side by side today.",
  },
  {
    q: "Does it support Mada / STC Pay / Tap?",
    a: "Not yet — payments are scaffolded but the actual gateway wiring lands in Sprint 3. We're being deliberate: the GCC market needs Mada and Apple Pay first, not Stripe-only. Until then, activation is on a SAR-priced launch promo. We'll never charge a card you didn't put in.",
  },
  {
    q: "Can I edit the destination after printing?",
    a: "Yes — that's the whole point of a dynamic QR. The printed code points at /r/<short-id> on our edge runtime; you update where it goes in your dashboard, and every existing print instantly follows. No reprint, no downtime, no broken links.",
  },
  {
    q: "Are scans tracked privately?",
    a: "We log country, city (Vercel-provided geo headers, no third-party IP service), device type, browser, and OS. IPs are SHA-256 hashed and truncated to 16 hex chars at write time — we never store raw addresses. Scans aren't tied to any user identity unless the QR is gated with a password.",
  },
  {
    q: "Halal / SFDA badges for menus?",
    a: "Halal flag and dietary tags (vegetarian, vegan, spicy, contains nuts) are first-class fields in our menu schema. They render with brand-correct iconography on the hosted menu page. The full Menu Pro builder ships next sprint.",
  },
  {
    q: "Where is my data stored?",
    a: "Supabase Postgres in ap-south-1 (Mumbai) — the closest AWS region to the GCC. We're evaluating a Riyadh / UAE region when AWS / Supabase land one; for now Mumbai gives us sub-100ms latency to most of the Gulf without compromising compliance.",
  },
  {
    q: "What happens if I cancel?",
    a: "Your existing QR codes stay valid — static ones keep working forever, dynamic ones either revert to a Masaar landing page (free tier) or stay live if you re-activate within 90 days. We don't auto-renew silently or send opaque \"I don't recognize this charge\" billing — every renewal is opt-in.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-sand-light/60">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
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

// B6 pivot — footer rewritten for the single-page funnel structure.
// Product column entries point at landing anchors directly (avoid the
// /product -> /#features redirect round-trip from the next.config.ts
// sub-page collapse). Company column drops Solutions / About (those
// stubs are now redirects). Resources column carries FAQ anchor +
// legal + Contact.
//
// Originally folded in B5 audit M1 + M4 (footer Log in /login hop +
// stale Resources entries); the pivot supersedes both since the whole
// footer link map gets rewritten anyway.
const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Create a QR", href: "/create" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Built for GCC", href: "#gcc" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
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
