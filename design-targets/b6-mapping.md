# B.6 Mapping — getqr structural patterns → Masaar implementation

*Phase 2 of Session B.6. Maps each getqr.com section pattern to Masaar's
landing rebuild (per approved ordering) and each header nav sub-page.
Awaiting Usama's approval before Phase 3 code.*

Phase 1 reference: `design-targets/getqr-analysis.md` + `design-targets/getqr/` screenshots.

Phase 1 open-question answers (locked in):
- **Q1 testimonials:** Skip the testimonial section in B.6. Replace with a "Built in Riyadh, made for the GCC" honest-positioning block.
- **Q2 interactive demo:** Static 15-content-type tile grid linking to `/create`. No live mini-builder.
- **Q3 ordering:** Hero → Trust → HowItWorks → 5-Feature Grid (new) → "Built in Riyadh" (new) → Pricing Teaser (new) → BuiltForGCC (existing) → FAQ (reinstated) → FinalCta.
- **Q4 trust strip:** Keep 6 "Example" wordmarks. No fake telemetry.

---

## Section-by-section mapping (landing rebuild)

For each row: `getqr pattern → Masaar action → structural borrow → content direction → estimated time`.

### Landing — top of page

| # | Section | Action | getqr structural borrow | Masaar content direction (GCC-native) | Est. |
|---|---|---|---|---|---|
| 1 | **Hero** | **Keep + minor polish** | Already structurally similar (2-col copy + dashboard preview). NO typewriter animation (skip per Q-skip list). NO clutter — keep the single dashboard browser-frame card (cleaner than getqr's 5 overlapping cards). | Existing hero stays. Two micro-edits: (a) tighten the eyebrow chip color/contrast; (b) keep "No credit card required" + "Setup in minutes" affordances under the CTAs (getqr lacks these, ours is honest). | 15m |
| 2 | **Trust strip** | **Keep + minor polish** | Underline letter-spacing + uppercase pattern is consistent with getqr's tone-neutral footer trust elements. | Keep the 6 wordmarks (Nexora / Alvora / Midaar / Qahwati / Syhera / Hilal) with "Example" sub-label intact. Tighten spacing per getqr's `py-8` rhythm. | 10m |
| 3 | **HowItWorks** | **Modify — add chip-row preview** | Borrow getqr's chip-row-above-step-card pattern. Each of 3 steps gets a preview chip row showing what's involved at that step. | **Step 1 chips:** Website / Menu / WhatsApp / vCard / WiFi. **Step 2 chips:** Colors / Logo / Frame / Styles. **Step 3 chips:** PNG / SVG / JPG / Print-ready. Titles stay: "Create your code" / "Print & deploy" / "Track & adapt". | 30m |
| 4 | **5-Feature Grid** | **NEW — biggest structural add** | Borrow getqr's `lg:grid-cols-5` icon + h3 + 2-sentence body card pattern. Stacks to single column at mobile, icon-left-of-text. | **5 Masaar-specific features (NOT copied from getqr's generic 5):** **(a) Dynamic destinations** — change where it points without reprinting. **(b) GCC-ready content types** — Website + Menu + WhatsApp + WiFi + vCard tuned for Saudi habits. **(c) Real-time scan analytics** — Riyadh-time, geo + device, hashed IPs. **(d) Custom branding** — logos, colors, dot styles, gradient. **(e) AI menu builder (coming soon)** — upload a photo, get a structured bilingual menu (signals roadmap without overpromising). | 45m |
| 5 | **"Built in Riyadh" positioning block** | **NEW — replaces testimonials** | Borrow getqr's container/card pattern (rounded-3xl, generous padding, brand-tinted background OR neutral with imagery). One-card section, not a grid. | "Built in Riyadh, made for the GCC" eyebrow. H2 "Why Masaar exists". One honest paragraph: GCC businesses paying $99/mo to dollar-priced tools that don't speak their market, don't accept Mada, don't load fast in Arabic. Masaar is the alternative. Sub-line: roadmap teaser ("Mada / STC Pay payments coming Sprint 3 · Arabic + RTL coming Session E · Menu vertical launching next"). Visual: stylized map of GCC with Riyadh pinned + the LogoMark. NO fake testimonials, NO "Example" labeled customer names. | 30m |
| 6 | **Pricing Teaser** | **NEW — links to full /pricing** | Borrow getqr's 3-card grid with the middle card highlighted ("Most popular") + "Save X%" badges. Section heading like "Plans that grow with you". Each card: tier name, SAR price, 3 included items, CTA. | **3-card preview of the 4-5 tier table that lives on /pricing.** Cards: **Free** (SAR 0, 5 QR codes, basic analytics) · **Pro** (SAR 79/mo, unlimited dynamic QRs, full analytics, customization — **MOST POPULAR**) · **Menu Pro** (SAR 199/mo, everything in Pro + Menu vertical + AI import + photo CDN). "Show all plans →" link to `/pricing`. HONEST: no $1 trial trap. | 30m |
| 7 | **BuiltForGCC** (existing deeper section) | **Keep** | No getqr equivalent — this is Masaar-specific. The bilingual EN/AR side-by-side panel is brand-defining. | Keep as-is. Possibly tighten Arabic copy in Session E. | 5m review |
| 8 | **FAQ** (reinstated) | **Rebuild — was unmounted in B.5/Item 4** | Borrow getqr's native `<details>` accordion anatomy: chevron rotation on open, divider lines between rows, dense vertical stack. | **6-8 Masaar-specific questions (NOT mirroring getqr's billing-defensive set):** (a) "How is this different from a free QR generator?" (b) "Will it work in Arabic?" (yes, RTL coming Session E) (c) "Does it support Mada / STC Pay?" (coming Sprint 3, honest) (d) "Can I edit the destination after printing?" (yes, the whole point) (e) "Are scans tracked privately?" (yes, IPs hashed) (f) "Halal / SFDA badges for menus?" (coming with Menu Pro) (g) "Where is my data stored?" (Supabase ap-south-1 / Mumbai, honest) (h) "What happens if I cancel?" (your QRs stay, dynamic ones revert to a Masaar landing). | 30m |
| 9 | **FinalCta** | **Keep + minor polish** | Standard close-the-deal pattern present in getqr's footer area. | Keep existing copy "Ready to give every scan a path?" + dual CTAs (Create yours now / See pricing). Maybe align the secondary CTA to point at `/pricing` (already does). | 10m |
| 10 | **Footer cleanup** | **Modify — folds in M1 + M4** | n/a (no structural change, just link audit). | M1: remove the `/login → /` redirect-hop link entirely (Log in lives in the header). M4: replace stale Resources column entries with the real `/resources` index sections that exist post-Phase 4. | 15m |

**Landing total: ~3 hours 30 min** (one commit per section / per logical change → 8-10 commits).

---

## Sub-pages mapping (Phase 4)

The 5 header nav routes currently exist as A-era stubs. Build out each with real content.

| # | Page | getqr structural borrow | Masaar content direction | Est. |
|---|---|---|---|---|
| 11 | **`/product`** | Borrow getqr's 5-feature grid pattern + extend each feature into a long-form section (icon + h2 + 2-3 paragraphs + supporting visual). Section ordering inspired by getqr's landing flow. | Long-form deep-dive on the 5 landing features + 2 more: dynamic destinations, content-type breadth (with embedded 15-type tile grid), real-time analytics, customization studio, AI menu coming-soon, password protection coming Session I, frames coming Session I. Each section: real screenshot from the wizard or dashboard. | 45m |
| 12 | **`/solutions`** | No direct getqr equivalent (they don't have verticals). Use clean 3-col vertical card grid pattern (similar to landing's 5-feature grid but each card is bigger and has a use-case story). | 6 vertical cards: **Restaurants & Cafes** (Karak Express / Spiceworld-style menu example), **Retail** (storefront QR + product info), **Hospitality** (hotel QR + WiFi + concierge), **Real Estate** (property listing QR + virtual tour), **Events** (ticket QR + venue info), **Service Businesses** (booking QR + contact card). Each card: vertical-specific feature callout + "Example" labeled customer hint + CTA to `/create`. | 30m |
| 13 | **`/resources`** | Borrow getqr's `/help` index pattern (category list + article preview cards), but for marketing content not support. | 4 sections: **Getting Started Guide** (link to a stub `/resources/getting-started`), **How dynamic QR codes work** (1-page explainer, can ship inline), **GCC marketing tips** (3-card preview, "Coming soon" on individual articles is acceptable per prompt), **FAQ anchor** (link back to landing FAQ). | 30m |
| 14 | **`/about`** | No direct getqr equivalent. Clean mission/story pattern (one column, generous vertical rhythm, occasional pull-quotes). | **Hero:** "Built for GCC businesses". **Section 1 — Founder note** (a short, honest Usama-voice paragraph: GCC SMBs deserve a tool that speaks their market). **Section 2 — Why Masaar exists** (gap analysis: tools designed elsewhere, dollar prices, no Mada, no Arabic). **Section 3 — What we're building** (roadmap snapshot honest about what's live vs coming). **Section 4 — Built in Riyadh** (region anchor + Masaar mark). **Footer CTA:** `/contact` for partnership inquiries. | 30m |
| 15 | **`/pricing`** | Borrow getqr's 3-card pricing grid pattern + "Most popular" highlight pattern + "Save X%" badge — but rewrite tier structure honestly. Add monthly/annual toggle (saved % shown on annual). Add feature comparison matrix below the cards. Add pricing-specific FAQ accordion at the bottom. | **5 tiers per STRATEGY.md §5:** Free (SAR 0) / Starter (SAR 29/mo) / **Pro** (SAR 99/mo, Most Popular) / **Menu Pro** (SAR 199/mo) / Menu Pro + Ordering (SAR 299/mo). Annual toggle saves 20%. Feature comparison matrix shows which features land in which tier (real ones live + roadmap items honestly marked "Coming soon"). Pricing FAQ: 5 questions (annual vs monthly, what counts as a scan, Mada when, refund policy, custom plans). | 60m |

**Sub-pages total: ~3 hours 15 min** (one commit per page → 5 commits).

---

## M1-M5 fold-in (Phase 5)

Per the B.5 audit triage. Each item below names its target file + commit-fold location.

| Item | Fold-in commit | Action | Est. |
|---|---|---|---|
| **M1** Footer Log in `/login` hop | Folded into landing Footer cleanup (mapping row 10) | Remove the `{ label: "Log in", href: "/login" }` entry from `FOOTER_COLS` Resources column in `src/app/page.tsx`. Log in is in the header. | included |
| **M2** `/dashboard/qr-codes` chip drift | Standalone commit in Phase 5 | Convert the `<li>` row from flex to CSS grid with explicit columns so chip left-edges align across rows. File: `src/app/dashboard/qr-codes/qr-codes-client.tsx`. | 15m |
| **M3** "Add payment method" placeholder in right rail | Standalone commit in Phase 5 | Delete the button from `RightRail` in `src/app/dashboard/overview-client.tsx`. Re-add when wallet feature lands in Sprint 3. | 10m |
| **M4** Footer Resources column stale entries | Folded into landing Footer cleanup (mapping row 10) | Replace `Guides & docs → /resources` with the actual `/resources` sub-page anchors post-Phase 4. Remove `Log in → /login`. | included |
| **M5** Welcome email "Tip" copy on `/checkout/success` | Standalone commit in Phase 5 | Rewrite from *"Tip: the QR you downloaded works now"* to *"Tip: scan the QR in your inbox to see your destination live."* File: `src/app/checkout/success/page.tsx`. | 10m |

**M1-M5 total: ~35 min** (M1+M4 inline; M2/M3/M5 each isolated).

---

## Out of scope reminder (from B.6 prompt)

NOT touching in B.6:
- New content types (Session C)
- Password gating / frames / logo library (Session I)
- Arabic translation of the new copy (Session E — English ships first)
- Real testimonials (Sprint 3 — need 5+ real GCC customer wins first)
- AI Menu builder (Session F)
- Mobile sidebar drawer (BACKLOG)
- L1-L6 from the audit (BACKLOG)

---

## Total time estimate

| Phase | Work | Est. |
|---|---|---|
| Phase 3 — Landing sections (10 commits) | 3h 30m |
| Phase 4 — Sub-pages (5 commits) | 3h 15m |
| Phase 5 — M1-M5 fold-in + report (3 commits + report) | 1h |
| Verification (Chrome MCP + build greens) | 30m |
| **Total** | **~8 hours 15 min** |

Matches prompt's 1.5-day estimate.

---

## Visual sanity check methodology

For each landing section + sub-page commit:
1. Push branch
2. Open the new section on `masaar-git-sprint-2-session-b6-landing-polish-...vercel.app` (preview)
3. Take Chrome MCP screenshot at desktop 1440 + mobile 375
4. Compare side-by-side against:
   - The corresponding `design-targets/getqr/getqr-*-desktop.png` for structural pattern check
   - The current production Masaar landing for brand consistency check
5. Verify both: structural match + brand mismatch
6. If either fails, iterate on the section before moving to the next commit

This is the "Chrome MCP verify before claiming done" pattern from B.5.

---

## Brand-discipline guardrails

Before each Phase 3 / Phase 4 commit lands:

1. **No copied text** — grep my new commits for any phrase >5 words that matches a getqr screenshot. If matched, rewrite.
2. **No copied logos** — trust strip stays the 6 invented "Example" wordmarks.
3. **No `bg-blue-*` / `text-blue-*`** — brand palette only (`deep-teal`, `terracotta`, `sea-teal`, `sand-light`, `charcoal`).
4. **No Inter for display** — `font-display` (Manrope) only on H1/H2; Inter for body.
5. **No "Most popular" without honesty** — Pro tier IS our most popular intent; the badge is true.
6. **No fabricated stats** — every number on the landing is real (B5 social-proof fallback pattern: real if ≥100, "Be among the first" if low).

---

## Ready for approval

Awaiting Usama's read on the mapping above. Specific decisions to confirm:

- **Mapping rows 1-10** (landing sections) — approve as-is, or any specific section to re-scope / drop / add?
- **Mapping rows 11-15** (sub-pages) — `/about` founder note: I'll draft a humble GCC-mission paragraph in your voice; you'll get to review before it ships. OK?
- **M1-M5 fold-in plan** — approve standalone commits for M2/M3/M5; M1/M4 inside the landing footer cleanup?
- **Time estimate** — 8h matches prompt's 1.5d. If you want me to compress (drop a section, ship leaner), say which.

After your approval I'll start Phase 3 with one section per commit, pushing after each, Chrome MCP verifying as I go. One review pause at end of Phase 3 (assembled landing), one at end of Phase 4 (sub-pages), one final pre-merge.
