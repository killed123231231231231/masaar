# getqr.com — Chrome MCP Structural Analysis

*Captured 2026-05-24 for B.6 landing rebuild. Source: live navigation +
DOM inspection via Chrome MCP, plus full-page PNG captures at 1440×900
(desktop) and 375×812 (mobile) via puppeteer-core driving the user's
installed Chrome. Screenshots live in `design-targets/getqr/`.*

**This is a structural reference, not a copy spec.** We borrow grids,
spacing rhythm, and component anatomy. We do **not** borrow text,
testimonials, logos, or pricing. Brand identity, content, and
positioning stay Masaar / GCC-native.

---

## 1. Site map

GetQR is essentially a **single-page conversion funnel**. There is no
`/product`, `/solutions`, `/pricing`, or `/about` sub-page — pricing
lives as a section ON the landing, and product/solutions detail is
folded into the landing's feature grid and 3-step explainer.

Discovered routes (footer scrape, deduped):

| Path | Purpose | Captured? |
|---|---|---|
| `/` | Landing — hero + 6 marketing sections + footer | ✅ desktop + mobile |
| `/help` | Help center index (separate React app) | ✅ desktop + mobile |
| `/eula` | Terms of service | ✅ desktop + mobile |
| `/privacy-policy` | Privacy policy | skipped (legal boilerplate, no structural signal) |
| `/help/contact-get-qr-support` | Support form | skipped (form-only) |
| `/cancel-subscription` | Self-serve cancellation | skipped (auth-gated) |

**Architectural takeaway for Masaar:** getqr's "minimal nav" pattern
is a deliberate B2C-style funnel choice. Masaar's planned 5 nav pages
(`/product`, `/solutions`, `/resources`, `/about`, `/pricing`) is a
B2B/credibility play — different positioning. We borrow getqr's
**landing density** but keep our broader sub-page surface.

---

## 2. Landing — section anatomy (desktop)

Page total height: **5,218 px** at 1440×900. Seven distinct sections
under a static (not sticky) header.

### Section order

| # | H1/H2 | Top px | Anatomy |
|---|---|---|---|
| 0 | Header (no H) | 0 | `bg-white, h=65px, static position`, contents: logo + Log In + Create QR Code |
| 1 | `Generate [Smart/Editable/Dynamic] QR Codes` | 248 | Hero — typewriter animation cycles the adjective word; 2-col grid (copy left, floating dashboard cards right) |
| 2 | `Create QR In 3 Simple Steps` | 901 | 3-card explainer — content-type chip row above each card, numbered 1/2/3 |
| 3 | `Generate QR code in seconds.` | 1507 | Interactive demo card with 15 content-type tabs + live preview pane |
| 4 | `More Than Just a QR Code Generator` | 2125 | 5-feature grid — icon + title + 2-sentence body per card |
| 5 | `Why Our Customers Choose GetQR` | 2666 | Reviews.io live-feed widget — Trustpilot-style top strip + horizontal scrolling cards |
| 6 | `Start 7-Day Trial Today, Upgrade when You Need` | 3219 | 3-tier pricing — highlighted middle card, "Save X%" badges |
| 7 | `Frequently Asked Questions` | 3917 | 13-question accordion |
| 8 | Footer | ~5000 | Multi-column, links + brand mark |

### Spacing rhythm

Inspected via `getComputedStyle` on the main `<section>` containers:

- **Section vertical padding:** `pt-12 pb-8` ≈ **48px top / 32px bottom** consistently
- **Section horizontal padding:** `px-4 sm:px-6 lg:px-8` ≈ **16/24/32px**
- **Max content width:** `max-w-7xl` = **1280px** (Tailwind default)
- **Card-grid gap:** consistent `gap-6` (24px) on feature/step grids
- **Section transitions:** subtle — alternating white / `rgba(250,250,250,0.8)` neutral tint. NOT cream/sand like Masaar. NOT bold color blocks.

### Header anatomy

```
height: 65px
position: static (not sticky — page scrolls past it)
bg: solid white
contents (left to right):
  GetQR logo (~28px)
  [no nav links]
  Log In (text button, transparent)
  Create QR Code (blue solid pill)
```

**This is intentionally minimal.** No Product / Solutions / Pricing
in the header. Pricing and product detail are scrolled to via in-page
anchors or just the landing scroll itself.

---

## 3. Section-by-section breakdown

### S1. Hero

Visual: see `getqr-landing-full-desktop.png` rows 0–700.

- **Eyebrow chip:** `🏆 #1 QR Code Generator` (text + icon, no border)
- **H1:** Two-line, ~5xl font weight 900, **typewriter animation** cycles the middle word: "Generate **Smart** QR Codes" → "Generate **Editable** QR Codes" → "Generate **Dynamic** QR Codes". The animated word has a teal underline accent.
- **Subhead:** Single sentence, ~lg, gray-600. "Dynamic & customizable QR codes with analytics that you can edit even after printing!"
- **Single CTA:** Blue solid pill, `Create QR Code` (no secondary "Book demo" affordance — purely transactional)
- **No "no credit card required" footnote** under the CTA (different from Masaar's B5 hero)
- **Right column:** Layered floating cards — a `Scans by geo` donut card, a QR table (with thumbnail rows like real product UI), `Scans by device` bars, `Last 7 days` trend chart, `Scans by QR type` mini-list. Cards are slightly rotated and overlapped to feel dynamic.
- **Hero trust strip (mobile only):** "Trusted by 1,151,498 users" specific number — looks like real telemetry (not a round number)

**Masaar comparison:** Our current hero is two-col (copy + browser-frame dashboard preview), eyebrow "ADAPTIVE QR PLATFORM", H1 "Adaptive dynamic QR codes for GCC businesses" with italic accent on "GCC businesses", primary CTA "Create QR Code" + secondary "Book a demo", floating phone + signage cards. **Already structurally similar to getqr's pattern.** No typewriter — could add one or skip; the italic-GCC accent is the equivalent "interesting word" treatment.

### S2. "Create QR In 3 Simple Steps"

- Three large cards in a `lg:grid-cols-3` grid
- Each card has:
  - A **chip row at the top** showing relevant items: card 1 shows content-type chips (Website / PDF / Video / WhatsApp / Image / WiFi); card 2 shows customization chips (Colors / Add Logo / Styles); card 3 shows export-format chips (PNG / SVG / JPEG / High Quality Export)
  - A big **numbered marker** (1, 2, 3) in muted color, large display font
  - **Title:** `Select Your QR Code Type` / `Customize Your QR Code` / `Download & Share`
  - **Body:** 1-sentence description
- **Visual signal:** the chip row above each step PREVIEWS what's involved — different from Masaar's icon-only step cards

**Masaar comparison:** Our current `HowItWorks` has 3 plain cards with icon + title + body. The numbered-step pattern matches. The **chip-row preview** is new — a structural upgrade we can borrow (no copying required: our chips would be GCC content types like Website / Menu / WhatsApp / vCard / WiFi).

### S3. "Generate QR code in seconds." (interactive demo)

Two-column section:
- **Left col:** **15 content-type tabs** — Website / vCard / PDF / Image / Video / App Link / WhatsApp / SMS / Social Media / WiFi / Feedback / Payment / Email (matches what their builder offers)
- **Right col:** Live mini-preview pane showing a phone mockup with a fake browser/menu, AND the corresponding QR generated for the selected type
- A blue "Create QR Code" CTA below the tabs

**This is a "try-it-here" affordance** without making the user navigate. Probably converts well — visitors get a sense of the breadth before clicking through.

**Masaar comparison:** We don't have an inline demo on the landing. Out of scope for B.6 (would need a wired-up mini-wizard). **Recommend: borrow the visual layout but make it static** — a screenshot of the wizard's Step 1 grid with all 15 types shown, captioned "15 content types ready to go", linking to `/create` for the real thing.

### S4. "More Than Just a QR Code Generator" (features grid)

**5 features**, single-row at desktop (`lg:grid-cols-5`), stacked mobile.

Per-feature anatomy:
- Icon (small, top-left, brand teal-ish)
- Title (`h3`, ~base font weight 700)
- Body (~sm gray-600, 2-3 sentences)

Captured copy (paraphrased for analysis, NOT to be copied to Masaar):

| Feature | Theme |
|---|---|
| Full Customization | Colors / shapes / frames / logo |
| Dynamic & Editable | Update destination without reprint |
| Advanced Analytics | When / where / how often |
| Password Protection | Gated content |
| High-Quality Downloads | PNG/SVG/JPEG sharp output |

**Notable:** all 5 are generic, none reference vertical use cases (no
"perfect for restaurants" / "menu-ready"). Their feature copy is
positioning-neutral.

**Masaar comparison:** Our current landing has no equivalent feature
grid — `AnalyticsPreview` is the closest, but it's a single feature
deep-dive not a grid. **This is the biggest structural gap.** B.6
should add a 5-feature grid in this slot, with Masaar-specific copy:
real-time scan analytics / dynamic-without-reprint / logo +
customization / 15+ content types / AI menu coming soon / GCC-native
defaults. Borrow getqr's grid + card anatomy 1:1; rewrite every word.

### S5. "Why Our Customers Choose GetQR" — testimonials

**Authenticity audit — this is a key positioning finding.**

- Top strip: `Excellent  ⭐4.86 based on 1,415 reviews` — Trustpilot-style aggregate
- Live-feed widget (likely Reviews.io / Trustpilot embed)
- Each testimonial card shows:
  - First name (or short name): `Megan`, `Zachary Green`, `Mendoza`, `Florence`, `Elias Abernathy`
  - `Verified Customer` badge
  - 5-star rating
  - Body (~50–80 words, specific use case mentioned)
  - Location + time-ago: `Guipavas, FR, 28 seconds ago` / `Carpentras, FR, 8 hours ago` / `Catania, IT, 12 hours ago` / `Nová Bašta, SK, 14 hours ago`

**Verdict: REAL.** The cities are obscure (Guipavas, Nová Bašta — not "Riyadh / Dubai marketing favorites"). The "28 seconds ago" timestamp is live-updated. The 1,415 review count + 4.86 decimal looks like real telemetry, not a round marketing number. Names are international.

**Positioning implication for Masaar — the big call:**

GetQR has 5 years of customer accumulation. Matching it requires either:
- **A. Match scale theater** — get 5-10 real Saudi cafe testimonials Usama personally collected, ship them with photos + city + Mada-relevant context, label every un-verified one "Example". Hard prerequisite: actual relationships with named cafes.
- **B. Lean into "Be among the first"** — explicitly frame the absence as a positioning choice. "Masaar launched 2026 for the Saudi market. Be one of our launch customers." Add an "Early access roster" wall with logos coming soon. Turns the absence into a roadmap signal.

**Recommended:** B for B.6, with a roadmap pivot to A once Usama has 5+ named-customer wins. The B5 social-proof fallback ("Be among the first to create your QR") is already on-brand for B. Don't fake testimonials with "Example" + made-up names — feels worse than honest scarcity.

### S6. "Start 7-Day Trial Today, Upgrade when You Need" — pricing

**3-tier card grid** with the middle (Quarterly) typically highlighted.

| Tier | Headline | Sub | Body |
|---|---|---|---|
| 7-Day Trial | `$1.00 / 7 days` | then renews at `$39.99/mo` | Unlimited QR codes / Advanced analytics / Full customization |
| Quarterly | `$29.99 /month` | `Save 25%` | Same features |
| Annual | `$19.99 /month` | `Save 50%` | Same features |

**This is dark-pattern pricing** by my read:
1. The "$1.00 trial" auto-renews at $39.99/mo unless cancelled
2. All 3 tiers have IDENTICAL features — the only variable is billing cadence (so the "Save X%" is the only carrot)
3. FAQ confirms the pattern: 6 of 13 questions are about cancellation / refunds / "I don't recognize this charge" — classic trial-trap support overhead

Geo-priced too: `"Prices may vary depending on your country and current promotions."`

**Masaar positioning move (already aligned with STRATEGY.md):**
- SAR pricing, upfront, no $1 trial trap
- Tiered by feature, not just billing cadence (Free / Starter / Pro / Menu Pro / Agency per STRATEGY §5)
- "Start free, upgrade when you scale" — Free tier with real (limited) usage, not a 7-day trap

For the B.6 `/pricing` page: borrow getqr's **card grid layout** and **"Most Popular" highlight pattern**, but ship 4-5 tiers (matching STRATEGY) with SAR pricing and an honest annual-toggle. Don't borrow the trial-trap structure.

### S7. "Frequently Asked Questions"

13 questions, native `<details>`/accordion pattern. Captured list:

```
1. What is GetQR?
2. Why use GetQR instead of free QR generators?
3. Do I need to install software to use GetQR?
4. Can I edit my QR code after printing?
5. Is GetQR free?
6. How do I create a GetQR account?
7. How does automatic renewal work?
8. Why was I charged after my trial?
9. How do I cancel my subscription?
10. What happens if I cancel my subscription?
11. What happens if my subscription expires?
12. I don't recognize this charge. What should I do?
13. Can I get a refund?
```

**Six of 13 are billing-defensive.** This tells you the actual customer
pain — confusion around the trial-to-paid transition.

**Masaar FAQ should NOT mirror this.** Our FAQ (the one we removed in B.5
and need to REINSTATE per the prompt) should focus on the questions a
Saudi cafe owner would actually have:

- "How is this different from a free QR generator?"
- "Will it work in Arabic?" (yes, RTL coming Session E)
- "Does it support Mada / STC Pay?" (coming Sprint 3, honest)
- "Are scans tracked privately?" (yes, IPs hashed)
- "Can I edit destination after printing?" (yes — the whole point)
- "Halal / SFDA badges for restaurant menus?" (coming with Menu Pro)
- "Where is my data stored?" (Supabase Mumbai region — close to GCC, honest)
- "What happens if I cancel?" (honest: your QRs stay, dynamic ones revert to a landing page)

Borrow getqr's **accordion anatomy** (chevron + smooth open). Rewrite every Q&A.

### S8. Footer

Standard multi-column. Footer columns I could scrape:
- Footer's link `innerText` came back empty in DOM scrape — probably hydrated late or wrapped in framework anchors. Visible in screenshot rows 4900–5100: 3-column with brand mark + Customer Support / Legal / Company.

**Masaar already has a multi-column footer** (`SiteFooter`) that's
structurally equivalent. The M1/M4 audit items (Log in footer hop +
stale Resources column) should be folded into this rebuild.

---

## 4. Header / sticky behavior

- **Desktop:** static (not sticky). Scrolls out of view as user scrolls down. Stays simple — logo + Log In + primary CTA only.
- **Mobile:** still static — no hamburger menu, just the same 3 elements at smaller size.

**Masaar comparison:** Our `SiteHeader` is **sticky with backdrop-blur**. We have full nav (Product / Solutions / Resources / Pricing / About) + auth-aware right side. **More substantial than getqr's**, which is the right call for B2B credibility. Don't downgrade. (M3 / mobile-nav drawer is a separate Sprint 3 item.)

---

## 5. Color / typography summary

| Token | getqr value | Masaar equivalent |
|---|---|---|
| Body font | Inter | Inter (same!) |
| Display font | Inter (weight 900) | Manrope (different, ours feels more editorial) |
| Primary brand color | Blue ~`#2563EB` (Tailwind blue-600 family) | Deep-teal `#0F5B55` |
| Secondary accent | Teal-ish `rgba(0, 102, 102, 0.1)` overlays (limited use) | Terracotta `#E07A5F` |
| Text primary | `rgb(17, 24, 39)` (slate-900) | `charcoal` `#1B1B1D` |
| Page bg | white + `rgba(250,250,250,0.8)` subtle alt | white + cream `#F6F4EE` |
| Card bg | white with soft border | white with `border-charcoal/10` |
| Section transition | Subtle (alt 250/255 grays) | Mix: cream sections + white sections, more contrast |

**Key visual difference:** Masaar uses cream (`#F6F4EE`) as a section
backdrop where getqr uses near-white tints. Cream is more editorial /
warmer — fits our GCC-premium positioning. **Don't standardize to
getqr's near-white** just to match — the cream is a brand-defining
choice from session B.

**Manrope vs Inter:** Manrope has more personality (the geometric "g",
the rounded but deliberate display weight). Inter is the safer choice
but more generic. Keeping Manrope is correct for our positioning.

---

## 6. Mobile observations (375×812)

Captured: `getqr-landing-full-mobile.png` (1.6 MB — full page rendered tall).

**Notable mobile behaviors:**
- Hero stacks: text on top, dashboard preview below. Cards reduce to 1 or 2 stacked rather than overlapping.
- 3-step section: cards stack vertically, full-width. Chip rows still visible above each card.
- 15-content-type tabs: become a 3-column grid (5 rows × 3) — same affordance, different layout.
- 5-feature grid: collapses to single column, icon-left-of-text rather than icon-above-text on desktop.
- Pricing cards: stack vertically; "Most popular" badge still on the middle card.
- FAQ accordion: full-width with same anatomy.
- Trust strip pulls up to the top of mobile, just below the hero CTA: "Trusted by 1,151,498 users".

**Header on mobile:** Same elements (logo + Log In + Create QR Code), no hamburger. The CTA pill stays right-side. This is reasonable because getqr has zero header nav anyway.

**Masaar mobile gap:** Our header has 5 nav links + auth state. At 375px the nav links currently hide (B5/H3 wired auth-aware but no mobile nav drawer). The B5 audit explicitly tags `Mobile sidebar drawer` as Sprint 3. B.6 should at minimum surface a "Menu" affordance, even if just a stack-into-vertical-list on the bottom of the header card.

---

## 7. What to borrow vs skip

### Borrow (structural patterns)

1. **5-feature grid** in the slot between explainer and testimonials — same anatomy (icon + h3 + 2-sentence body), 5 columns desktop / single column mobile
2. **Chip-row preview** on 3-step cards — show *what* gets selected/customized/downloaded as small chips above each step
3. **Interactive content-type tile grid** (static screenshot is fine for B.6) — visual proof of the 15-content-type breadth
4. **3-tier pricing card layout** for `/pricing` — highlighted middle card, "Save X%" badges (but rewrite the actual tiers + pricing structure honestly)
5. **FAQ accordion** anatomy — chevron, smooth open, divider lines
6. **Reviews.io-style horizontal-scroll testimonial widget** — but with "Example" labeling and a "be among the first" frame for B.6, transitioning to real customers in Sprint 3
7. **Section vertical rhythm** — `pt-12 pb-8 lg:pt-20 lg:pb-16` baseline (slightly bigger than getqr's 48/32 to give Masaar more breathing room)

### Skip / actively avoid

1. **Trial-trap pricing** ($1 → $39.99 renewal) — STRATEGY says SAR-upfront, real Free tier
2. **Stock-feeling generic feature copy** — our 5 features should call out GCC + dynamic-after-print + Saudi-friendly content types
3. **Header without nav** — keep our 5-page nav for B2B credibility
4. **Typewriter animation on H1** — neat but adds JS for marginal gain, our italic-GCC-accent already provides interest
5. **Cluttered floating hero cards** — getqr's 5 overlapping cards feel busy; our cleaner browser-frame-dashboard-preview is more brand-aligned
6. **Inter for display** — keep Manrope (more editorial)
7. **Blue primary** — keep deep-teal (brand)

### Open questions for mapping step

Some calls I want Usama's read on before Phase 2 mapping:

1. **Testimonials path** — do we go with `B. "Be among the first"` framing (no fake testimonials, honest scarcity), OR do we know enough real-customer wins (even 2-3) to seed an honest carousel? Recommend B for B.6.
2. **Interactive demo (S3 slot)** — static "15 content types" tile grid screenshot, OR a live mini-builder? Static is safe for B.6 (1 hour). Live mini-builder is 3-5 hours + needs new code.
3. **Section ordering** — getqr puts pricing BEFORE FAQ, with testimonials between features and pricing. Our B5 landing has: Hero → Trust → HowItWorks → AnalyticsPreview → BuiltForGCC → FinalCta. Should we re-order to: Hero → Trust → HowItWorks → **5-Feature Grid (new)** → Testimonials → **Pricing Teaser (new, linking to /pricing)** → FAQ → BuiltForGCC → FinalCta?
4. **Trust strip telemetry** — getqr shows "Trusted by 1,151,498 users". Masaar's real anon-flow count is small. Do we show a real (small) number, or keep the 6 "Example" wordmark logos? Recommend keeping the wordmarks for now; add a real metric in Sprint 3 once it's meaningful.

---

## 8. Sub-pages (`/help`, `/eula`) quick read

- **`/help`** (`getqr-help-full-desktop.png`, 47KB — very lightweight): Standard help-center index. Categories of articles. Search bar. Not structurally informative for B.6 because Masaar's `/resources` is positioned differently (Sprint-3-era articles + getting-started guide; getqr's `/help` is post-purchase support, which Masaar handles via `/contact` for now).
- **`/eula`** (1.4 MB desktop): Long-scroll legal page. Not structurally interesting. Masaar's `/terms` is the equivalent and already exists.

**No structural patterns to borrow from sub-pages.** The landing is the entirety of getqr's marketing motion.

---

## 9. Methodology check

This analysis is built from:
- ✅ Live navigation via Chrome MCP (DOM inspection, computed styles, accessibility tree)
- ✅ 6 full-page screenshots via puppeteer-core driving the user's installed Chrome (3 pages × 2 viewports), saved to `design-targets/getqr/`
- ✅ Authenticity inspection of the Reviews.io widget (testimonials are real, not stock)
- ✅ Pricing structure capture (identified as trial-trap, deliberately not mirrored)

No text or imagery was copied. Every "borrow" item is a structural
pattern (grid columns, card anatomy, spacing rhythm) — never a phrase,
testimonial, customer name, or specific feature claim.

Ready for the Phase 2 mapping step.
