# Sprint 2 — Session B Report: Visual Upgrade (Analytics + Dashboard + Landing + Checkout)

Branch `sprint-2/session-b-visual-upgrade` off `main@d36c5cd`.
**Merged to `main` via `3952d05` (no-ff merge commit).** Every commit
`tsc`+`build` green. Production auto-deploy on
`masaar-zeta.vercel.app` verified Ready (51s build).

Preview before merge:
`https://masaar-git-sprint-2-session-b-visual-upgrade-qasimahmed4444s-projects.vercel.app`

## What shipped

The original prompt was three phases. Mid-session Usama added **Phase 1.5**
to promote the new shell to be the real `/dashboard` home with account-level
data — folded in before Phase 2 started. Final commit list (oldest → newest):

### Phase 1 — Per-QR analytics page rebuild

- `bbb6e30` `lib/analytics.ts` — single owner-RLS-scoped data source
  (`getAnalytics(supabase, qrId, period) => AnalyticsBundle`). KPIs via
  accurate `count('id', { count: 'exact', head: true })` (fixes BACKLOG
  audit #4 — was capped at 5,000). Riyadh-day buckets via
  `toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })`. Trend
  deltas vs previous equivalent period. 50k row cap with
  `ROW_FETCH_CAP`.
- `8b8cf35` Full visual rebuild to `design-targets/analytics-dashboard-v2.png` —
  deep-teal sidebar (10 nav items, "Soon" pills on aspirational), 5-card
  KPI row (Total / Unique / Mobile share / Top country / Top city) with
  sparkline + trend delta, Recharts area trend with gradient, donut +
  bar breakdowns, recent activity + best performing tables, right rail
  with the user's actual QR list, Pro/Free plan card. Failed-scans
  callout when QR is `pending_payment` and has scans in the period.
- `69f1732` `GET /api/qr/[id]/scans.csv?period=` — Node-runtime CSV export,
  owner-scoped via RLS, 50k row cap with clear 413 + Sprint-3
  async-export note, RFC-4180 escaping, filename
  `masaar-<short_id|id>-<period>-<YYYY-MM-DD>.csv`.
- `72a4789` Mobile pass — top-bar back-link, table overflow scroll,
  padding adjustments at 375px.

### Phase 1.5 — Promote shell to /dashboard home (account-level Overview)

- `8795638` `getAccountAnalytics(supabase, userId, period)` — same
  bundle shape pattern, just fetches user's QR ids once then runs scans
  queries with `.in("qr_code_id", ids)`. Embeds `qr_codes(id, name,
  short_id)` on recent scans for QR name display. Includes
  `activeQrCount`, `totalQrCount`, `firstPendingQrId`,
  `firstPendingQrShortId` for the conversion callout. Returns
  `EMPTY_ACCOUNT` bundle when the user has no QRs.
- `fa1d143` Extract `Sidebar` + chart widgets into
  `@/components/dashboard/{sidebar.tsx,widgets.tsx}` so account-level
  and per-QR pages share the same shell verbatim. Routing knobs
  (`analyticsHref`, `reportsHref`, `upgradeHref`) drive whether the
  Analytics / Reports nav items are active or "Soon". Per-QR
  analytics-client now imports them; no behavior change.
- `d99888a` `/dashboard/qr-codes` — re-shelled QR grid. Search box
  (name / short_id / destination), Filters button (Soon toast),
  status pills, scan count, themed empty state.
- `7d403cb` `/dashboard` rebuilt as account-level Overview. 5-KPI row
  (Total / Unique / Mobile share / Top country / Active QR codes
  active-over-total), trend, 5 breakdowns, recent activity with
  QR-name column drilling into per-QR analytics, best performing,
  right rail with status indicators, FailedCallout deep-linking to
  `/checkout/<firstPending shortId|id>`. "Welcome back, &lt;first
  name&gt;" header + "+ Create QR" CTA + PeriodPills. FirstRunEmptyState
  for zero-QR accounts. `loading.tsx` skeleton updated to the new
  shell shape.

### Phase 2 — Landing hero refresh

- `e7997fa` Hero replaced in `src/app/page.tsx` to match
  `design-targets/landing-hero-v2.png`. Cream-on-cream
  (`#F6F4EE`) with deep-teal + terracotta blur backdrop. Eyebrow chip
  ("ADAPTIVE QR PLATFORM" + sea-teal sparkle), oversized serif H1 with
  italic "GCC businesses" accent, brand-line chip with the LogoMark +
  "Every scan has a path." CTAs: "Start free trial" → `/create`,
  "Book a demo" → `mailto:hello@masaar.sa?subject=Masaar%20demo%20request`.
  Browser-chrome preview card embeds
  `public/landing/dashboard-preview.png` (analytics-dashboard-v2.png
  copied into `public/`, served via `next/image` with `priority` +
  responsive `sizes`). Decorative phone mock bottom-left (menu QR
  result), signage card bottom-right ("Luxury Lifestyle of the Sea").
  Trust strip with 6 placeholder wordmarks (Nexora / Alvora / Midaar /
  Qahwati / Syhera / Hilal), each tagged "Example". SiteHeader CTA
  "Create QR" → "Start free trial". Removed unused hero helpers and
  industry-icon imports.
- `9d15b7e` Deterministic prices in the hero phone mock — flagged on
  review as a hydration nit (`Math.random()` rendered different
  numbers SSR vs CSR).
- `ada8f4b` `text-sea-teal` → `text-deep-teal-light`. `sea-teal` isn't
  in `tailwind.config` — the class was silently dropped. The token IS
  `deep-teal-light` (#3FA39A).

### Phase 3 — Checkout polish

- `5fbe4e3` `/checkout/[shortId]` two-column conversion-optimized rebuild.
  Server adds `recentQrCount()` via admin client (24h `qr_codes` count),
  passes to client; returns `null` on missing service role / failure →
  client shows "Be among the first to create your QR" instead of
  fabricating a number. Real 5:00 client-side countdown banner (resets
  on refresh, NOT fake persistence). Left column: live QrPreview +
  SocialProofCard with avatar cluster + 5-star strip. Right column:
  5-feature checklist, MASAAR-LAUNCH promo pill with computed savings
  %, SAR 5.00 total with strikethrough SAR 40.99 + trial fine print,
  three payment buttons (PayPal `#FFC439` yellow, GPay black with
  brand-safe stylized "G" mark, Card `#1A56DB` blue). All three route
  through `handlePay(method)` → existing `/api/checkout/activate` (or
  `/api/checkout/anon`); TODO comment marks the Sprint 3+ gateway
  routing. Testimonials carousel below the fold (4 cards, all
  "Example"-tagged, snap-x scroller for native mobile swipe + desktop
  arrow controls). Mobile sticky bottom Pay bar (`lg:hidden`).

## Acceptance criteria (28 total per the prompt)

| #  | Status |
|----|--------|
| 1  Analytics 90%+ visual match to mockup | ✅ side-by-side reviewed by Usama |
| 2  Sidebar nav with 10 items + Soon pills | ✅ |
| 3  5-card KPI row (Mobile share replaces Engagement) | ✅ |
| 4  Right rail = user's actual QRs | ✅ |
| 5  Scan sources panel hidden | ✅ |
| 6  Filter pills URL-backed; refresh preserves | ✅ via `?period=` |
| 7  Failed scans callout conditional on `pending_payment` + period scans | ✅ |
| 8  CSV export with proper filename + 50k cap | ✅ `/api/qr/[id]/scans.csv` |
| 9  Mobile responsive at 375px without horizontal scroll | ✅ |
| 10 Pro Plan usage card in sidebar | ✅ |
| 11 Landing hero 90%+ visual match | ✅ |
| 12 Headline + subhead copy matches verbatim | ✅ |
| 13 Brand-line tagline rendered with the Masaar mark | ✅ |
| 14 Dashboard preview uses analytics-dashboard-v2.png | ✅ `public/landing/dashboard-preview.png` |
| 15 iPhone + signage props in bottom-right | ✅ phone bottom-left, signage bottom-right per the mockup |
| 16 Trust strip 6 logos with "Example" footnote | ✅ |
| 17 CTAs route correctly (`/create`, mailto) | ✅ |
| 18 Rest of landing unchanged | ✅ HowItWorks / AnalyticsPreview / BuiltForGCC / Faq / FinalCta / Footer untouched |
| 19 Checkout two-column layout matches getqr | ✅ |
| 20 Real countdown timer | ✅ 5:00 client-side, decrements live, expires gracefully |
| 21 Three payment buttons routing through existing endpoints | ✅ |
| 22 Testimonials carousel with 4 Example-labeled cards | ✅ |
| 23 Real social-proof number with "Be among the first" fallback | ✅ admin-client COUNT, fallback when < 100 OR null |
| 24 SAR pricing with strikethrough | ✅ SAR 5.00 vs SAR 40.99 |
| 25 Mobile responsive + sticky bottom Pay bar | ✅ `lg:hidden` MobilePayBar |
| 26 Brand palette consistent (no raw blue/green outside payment buttons) | ✅ payment hex codes are PayPal/Card brand colors per spec |
| 27 `npm run build` green | ✅ every commit |
| 28 Self-audit + screenshots in report | ✅ below; screenshots = Usama's preview review + prod smoke |

**Phase 1.5 (added mid-session, not in original criteria list):**

- ✅ `/dashboard` is the account-level Overview with 5 account-wide KPIs
- ✅ `/dashboard/qr-codes` houses the (re-themed) QR grid
- ✅ Per-QR `/dashboard/qr/<id>/analytics` unchanged
- ✅ "+ Create QR" CTA prominent in both headers, routes to `/create`
- ✅ Sidebar routing across pages consistent

## Production smoke (post-merge)

Curl checks against `masaar-zeta.vercel.app` after the 51s production
build went Ready:

- `/` → 200, HTML contains all hero markers (`Adaptive QR platform`,
  `Start free trial`, `Book a demo`, `GCC businesses`,
  `Trusted by forward-thinking`, `Example`, `dashboard-preview.png`)
- `/landing/dashboard-preview.png` → 200
- `/dashboard` → 200 (after middleware redirect to
  `/login?redirectTo=%2Fdashboard`)
- `/dashboard/qr-codes` → 200 (after middleware redirect to
  `/login?redirectTo=%2Fdashboard%2Fqr-codes`) — confirms the new
  route exists and is gated
- `/checkout/<shortId>` without `draft_token`+`email` → 200 redirect
  to `/` (correct fail-safe in the new page.tsx logic)
- `/r/hfvrfy7` and `/r/hfvrfy8` (A.7 test QRs, both active) → 200
  redirect to `https://example.com/` (live resolver healthy)

What I **cannot verify from curl** without a session — Usama's browser
smoke covers it (confirmed in his "Merge" message above):

- Authed `/dashboard` Overview rendering with real KPIs
- Authed `/dashboard/qr-codes` grid with status pills
- Authed per-QR `/dashboard/qr/<id>/analytics`
- Anon end-to-end through the wizard
- Lock-in for `pending_payment` QRs → `/activate`

Usama confirmed all five on preview before the merge call.

## Self-audit

**What went well**

- The Phase 1.5 pivot mid-stream was clean. Extracting `Sidebar` +
  widgets into `@/components/dashboard/*` as a separate commit before
  building the new Overview meant both pages shared the same shell
  verbatim. `/dashboard/qr/[id]/analytics` bundle dropped from 114 kB →
  3.07 kB once Recharts was shared.
- Account-level data layer reuses the per-QR bundle shape pattern —
  same KPI / breakdown / time-series structure, just `.in('qr_code_id',
  ids)` instead of `.eq()`. Diff-friendly.
- Honest data fallback in the checkout social proof — admin-client
  failure (missing service role, network error) returns `null` so the
  UI shows "Be among the first" rather than fabricating "0 QRs created
  today" or hiding the card entirely.
- Real countdown vs fake urgency — the timer ticks honestly from page
  load and continues to allow Pay after expiry. Conversion psychology
  without the scammy-feel.

**What I shipped slightly wrong**

- **`text-sea-teal` typo (caught on Phase 2 review).** I assumed
  `sea-teal` was a Tailwind token because the brand palette references
  "sea-teal #3FA39A" — but `tailwind.config.ts` exposes it as
  `deep-teal-light`. Tailwind/PostCSS doesn't error on unknown
  utilities, so the sparkle icon silently fell back to currentColor.
  Fixed in `ada8f4b`. Same mistake almost recurred in the checkout
  `AvatarCluster` and testimonial tints — caught and fixed in the same
  pass before commit.
- **Math.random() in the hero phone mock (caught on Phase 2 review).**
  The decorative menu prices used `Math.random()`, which renders
  differently SSR vs CSR → React hydration mismatch on the dev
  console. Fixed to a fixed price array in `9d15b7e`. Should have been
  caught pre-commit; lesson: any `Math.random()` / `Date.now()` /
  `new Date()` in a server-component subtree (or in JSX that runs both
  on server and client) needs to be hoisted or seeded.
- **`bundle_period_safe()` helper** — I briefly threaded the period
  via a `window.location.search` reader inside the OverviewClient
  `PageHeader` to avoid prop-drilling. Caught it the same turn — that
  would have been an SSR/CSR mismatch since the server has no `window`.
  Replaced with a normal prop. Mention here because if I'd shipped it
  the bug would have been silent (default-to-30d on first paint then
  re-render to the URL value).

**What I deferred**

- Light analytics polish from the Phase 1 brief (top-3 spike
  annotations on the trend chart, X-axis tick density per period,
  hover tooltip restyle) — present at "good" not "perfect". Acceptable
  for the visual-upgrade pass; can revisit if Usama wants pixel-perfect.
- Mobile sidebar — at &lt;lg the deep-teal Sidebar is hidden entirely
  and the MobileTopBar takes over. Acceptable trade-off (Phase 1
  decision) but a proper drawer would be nicer. **BACKLOG-ed below.**
- Custom-range date picker (acceptance §283 stretch goal) — skipped.
  Not on Usama's must-have list.

## BACKLOG items added (§6 — Session B follow-ups)

Appended to `BACKLOG.md`:

1. **Mobile sidebar drawer.** The deep-teal Sidebar is `hidden lg:flex`
   on Overview, qr-codes, and per-QR analytics. At &lt;lg the
   `MobileTopBar` (back link + page label) is the only nav. A proper
   slide-out drawer with the full nav + plan card would close the gap.
   Phase-1.5 trade-off — not blocking.
2. **`SECURITY DEFINER` RPC to replace admin-client `recentQrCount`.**
   `/checkout/[shortId]` currently calls `createAdminClient()` to count
   24h-old QRs for the social-proof card. This widens the preview/prod
   attack surface (the admin client is also why Sprint 3 hardening has
   "rotate / restrict service-role key" on the list). A SECURITY
   DEFINER function `count_recent_qrs(since timestamptz) returns int`
   with `GRANT EXECUTE ... TO authenticated, anon` would let the
   regular Supabase client run the query without the service-role key.
   Same pattern as `resolve_qr_v2` + `create_anon_qr` + `claim_draft_qrs`
   in migrations 005–009.
3. **Custom date-range picker on analytics filter pills.** Stretch goal
   from Phase 1 §283. Add a "Custom range" pill that opens a date
   picker; URL params become `?from=…&to=…` alongside `?period=`.
4. **Trend-chart polish.** Spike annotations (top 3 days marked), X-axis
   tick density per period (every 7d for 30d period, every 30d for 90d,
   monthly for all-time), hover tooltip restyle. Phase 1 §314 nice-to-haves.
5. **`window.location.search` reader bug class.** I almost shipped a
   `bundle_period_safe()` helper that read URL params on every render —
   would have been an SSR/CSR mismatch. Add a lint rule (or at minimum
   a CLAUDE.md note) that any `window.*` read in a client component
   must be inside `useEffect` (or be SSR-safe via `typeof window`
   check). Caught this one in review; the lint would catch the next.
6. **Hydration-mismatch lint.** Same family as §5. Any `Math.random()`,
   `Date.now()`, `new Date()` in a JSX expression should be flagged
   (or required to be wrapped in a stable seed). `9d15b7e` was the
   hydration nit that prompted this.
7. **Real PayPal / Google Pay / Mada wiring (Sprint 3).** All three
   payment buttons currently route through the same flag-off endpoint.
   `TODO(Sprint 3)` comments mark the gateway routing locations. PayPal
   = PayPal SDK, GPay = Google Pay JS API, Card = Tap Payments /
   HyperPay / Mada per STRATEGY.md §5.
8. **Brand-safe GPay mark.** The black GPay button shows a stylized "G"
   in a white circle, NOT the real Google "G" logo (we can't ship the
   real one without brand permission). Sprint 3 should either get
   Google Pay brand-asset approval or keep the placeholder
   indefinitely.
9. **Testimonial system.** The 4 checkout testimonials are all
   `Example`-tagged placeholders. Once we have real customers, build a
   simple table (`testimonials(id, name, city, body, rating, when_text,
   approved bool)`) and replace the static array. The "Example" tag
   should stay on any un-approved entries.

## Lessons learned

1. **Tailwind doesn't fail on unknown classes.** `text-sea-teal`
   compiled silently and rendered `currentColor`. Always check
   `tailwind.config.ts` for the actual token name when adding a class
   that derives from a brand-palette mental model. The brief uses
   "sea-teal" as a brand color name; the config uses `deep-teal-light`.
   Don't trust the brief over the config — grep the config.
2. **Hydration mismatches don't break the build.** Both the
   `Math.random()` price bug and the `window.location.search` reader
   would have shipped silently and only shown up as a React dev-mode
   console warning + visible flicker on first paint. Self-review for
   `Math.random` / `Date.now` / `new Date` / `window.*` in client
   components.
3. **Refactor THEN extend.** I extracted the Sidebar + widgets into
   shared components (C2) before building the new account-level
   Overview (C3). If I'd built C3 first then refactored, I'd have had
   two copies to keep in sync. The C2 commit's diff was
   behavior-neutral (per-QR analytics looked identical pre and post)
   which made the refactor easy to review in isolation. Same pattern
   applies to Session C.
4. **Account-level data fetch is the per-QR fetch with a different
   `WHERE`.** I almost wrote `getAccountAnalytics` from scratch before
   noticing it's structurally the same as `getAnalytics` — just
   `.in('qr_code_id', ids)` instead of `.eq('qr_code_id', qrId)`, with
   `qr_codes(id, name, short_id)` embedded on recent scans. ~50% code
   reuse via a shared `groupTop` helper. Worth keeping the per-QR and
   account variants as two distinct exports rather than one
   parametrized function — the embedded-select pattern differs enough
   that the conditional logic would have been gnarly.
5. **Honest fallbacks read better than the "real" data sometimes.**
   The "Be among the first to create your QR" copy is more compelling
   on a small business's first day than "12 QR codes created today" —
   and the user explicitly approved that wording. Worth re-reading
   Strategy/copy briefs before defaulting to the "smarter" data path.

## Open questions for Usama

- **Phase 3 button order.** Spec shows PayPal → GPay → Card; I shipped
  that order. Some GCC checkouts (HyperPay, Tap) lead with Mada/Card
  because that's the regional dominant method. Worth swapping to
  Card-first for the Saudi launch? Easy reorder.
- **Social-proof threshold.** Currently shows the real number when ≥
  100 / 24h, "Be among the first" otherwise. Is 100 the right cutoff
  for "meaningful number"? Could move to 50 or 200; trivial change.
- **"Book a demo" target.** Current is
  `mailto:hello@masaar.sa?subject=Masaar%20demo%20request`. If you
  want it to go to a `/demo` form (Sprint 3) or Calendly, easy swap.
- **Test data left in prod.** Per the launch-prep sweep note —
  `hfvrfy7` and `hfvrfy8` SMOKE QRs still exist (both `active`,
  pointing at example.com), as do auth users
  `usamaahmed047+a7hotfixverify@gmail.com` and `+a7verify2@gmail.com`.
  Purge before public launch.

## Time spent

~1.5 working days across four phases, including the mid-session pivot
to add Phase 1.5. Build/typecheck overhead negligible (each ran in
under a minute).

## Next session

Per Usama's note: **Session C — file-hosted content types** starts
next. The 3-step wizard from A.5 handles URL / Text / vCard / Wi-Fi /
Email / SMS / Phone / WhatsApp / App Link content. Session C extends
to file uploads (PDF, image, video) hosted on Supabase Storage with a
public viewer route. Holding here until you ping.
