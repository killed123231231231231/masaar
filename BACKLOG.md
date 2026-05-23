# Masaar — Backlog

Pending work, grouped by urgency. Snapshot: 2026-05-18.

**See also:** `SPRINT2.md` (active sprint plan) and `STRATEGY.md`
(long-form market thesis and product strategy). Items below that are
folded into Sprint 2 are flagged with **→ Sprint 2**.

## 0. Blocking the brand-branch merge (do first)

- **Preview 500 `MIDDLEWARE_INVOCATION_FAILED` — RESOLVED 2026-05-17.**
  Cause: the 3 `NEXT_PUBLIC_*` vars were Production-scoped only, so
  preview builds had no env → `src/lib/env.ts` fail-fast threw in
  `src/middleware.ts`. Fix applied: added `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` to **Preview**
  scoped to branch `brand/integrate-masaar-v1` (CLI requires the
  git-branch positional in v53) and redeployed (no new commit). Preview
  now returns **401** (Deployment Protection for anon — expected; opens
  in a logged-in browser), not 500. `SUPABASE_SERVICE_ROLE_KEY`
  deliberately NOT added to Preview (keeps the smaller attack surface).
  Brand merge is now gated only on the user's visual eyeball.
- **Deferred — proper preview-env story:** `NEXT_PUBLIC_APP_URL` for
  Preview is a placeholder `https://preview.invalid` (brand review is
  visual; QR absolute-URL construction is intentionally broken-but-
  obvious on previews). A real per-preview value needs a Vercel System
  Env (e.g. `VERCEL_URL`) wired into `appUrl()` — defer to the
  logo-upload session.

## 1. Blocking before any public launch

- **Email-confirm re-verification on the prod URL.** `masaar` Supabase
  shipped with email confirmation OFF; it was enabled manually in the
  Dashboard during Step 5. Before launch, spot-check signup → real
  confirmation-email click → login against the **production** URL (Site
  URL / Redirect URLs must include the prod domain), not just localhost.
- **Purge live Supabase test data.** Two real test users live in the
  production DB: `usamaahmed047@gmail.com` (owns SMOKE TEST QR
  `WgcQX3E`) and `usamaahmed047+masaartest@gmail.com` (owns `Prod Smoke
  QR` `wWZXuTD`), plus their scan rows. Kept intentionally as the Step-8
  baseline — purge before public launch.
- **Domain decision + custom-domain wiring.** No domain bought
  (`masaar.sa` / `.io` / `.com` candidates); still on `*.vercel.app`.
  After buying: add the domain in Vercel + update Supabase Auth Site
  URL / Redirect URLs to the custom domain.
- **Repo public-vs-private posture.** `killed123231231231231/masaar` was
  made **public** during the prod session (to allow Vercel Git connect).
  Decide whether to keep it public or re-private (re-privatizing may
  require re-checking the Vercel Git integration).

## 1b. Analytics data quality (confirmed from live data)

- **Filter bot/automation hits from analytics.** Verified 2026-05-17:
  all 4 `WgcQX3E` scans were non-human — 1 Claude Code automation
  harness (UA contains `Electron`/`Claude`) + 3 `curl` verification
  hits; 0 real users. Bots/automation/link-previews inflate scan
  counts and show as Unknown country/city/browser/os. Sniff the UA for
  `HeadlessChrome` / `Electron` / `curl` / `wget` / `python-requests` /
  `facebookexternalhit` / `WhatsApp` / `Slackbot` / `Discordbot` /
  `TelegramBot` / `bot|crawler|spider` / Vercel health checks, and
  either set an `is_bot` column on `scans` or exclude them from the
  analytics aggregates. Supersedes nice-to-fix #5 (now confirmed, not
  theoretical). Also purge the existing automation/curl test rows when
  the test data is purged (BACKLOG §1).

## 2. Carry-forward from the brand session

- **Logo vectorization swap.** `public/logo.svg` is a 5.1 KB
  auto-trace-derived file (exceeds the <4 KB budget; mark/mono are
  ~1.5 KB). Consider replacing with a Fiverr / vectorizer.io
  pixel-accurate, optimized trace. `LogoMark` component
  (`src/components/logo-mark.tsx`) inlines the same 3 mark paths — update
  it too if the trace changes.
- **recharts hex palette** in `analytics-client.tsx` still uses the old
  blue hexes (`#0070cc` etc.) — Step 3 scoped this out. Recolor to the
  brand palette (deep-teal/terracotta/sand/charcoal) for chart
  consistency.
- **globals.css CSS vars** (`--background`/`--foreground`/`--muted`/
  `--border`) are still the original neutrals, not aligned with the
  brand `charcoal`/`sand` tokens. Align if a deeper theme pass is wanted.

## 3. Known follow-up sessions (priority order)

These have schema/lib scaffolding ready (see README §6 for detailed
prompts). One per session; deploy + smoke-test after each.
1. **Logo upload** — bucket `logos` exists; `qr_codes.logo_url` ready.
   **→ Sprint 2 (Session A)**
2. **Live scan feed** — Supabase Realtime on `scans`. *Deferred to
   Sprint 3+.*
3. **Frames** around the QR — `frame_style` / `frame_text` columns
   ready. **→ Sprint 2 (Session I)**.
4. **Password-gated QRs** — `password_hash` column ready. **→ Sprint 2
   (Session I)**.
5. **PDF export** — `pdf-lib` already a dep. **→ Sprint 2 (Session I)**.
   (Distinct from PDF content type, which is **→ Sprint 2 Session C**.)
6. **Folders UI** — `folders` table ready. *Deferred to Sprint 3+.*
7. **Full UI redesign** matching `brand/07-landing-page-hero-mockup.png`
   — 3-step wizard, new dashboard, new content types
   (WhatsApp / PDF / Image / Video / App Link). **→ Sprint 2
   (Sessions A, C, D).**
8. **Arabic translation + RTL** — `next-intl`, `dir="rtl"`; Plex Arabic
   font already wired. **→ Sprint 2 (Session E).**
9. **Restaurant Menu vertical** — new in Sprint 2. Specialized content
   type, dedicated builder wizard, mobile-first landing renderer,
   menu-specific analytics, dedicated marketing surface at `/menu`.
   See `STRATEGY.md` §2.2 and `SPRINT2.md` Phase 2. **→ Sprint 2
   (Sessions F-H).**

## 4. Deferred technical debt

- **chore(deps): coordinated upgrade** — `@supabase/supabase-js` is
  pinned to exactly `2.45.4` (no caret) because `@supabase/ssr@0.5.2`
  expects `^2.43.4` and npm's `^` had drifted it to `2.105.4`,
  collapsing every typed query to `never`. Bump `ssr` + `supabase-js`
  as a coordinated pair, regenerate `src/types/database.ts` from the
  live schema (`npx supabase gen types typescript --project-id
  hsnrupadmygkeirhujiv`), drop the pin. **Risk:** ssr cookie API changed
  0.5 → 0.7 — re-verify `lib/supabase/server.ts` + `middleware.ts`.
- **chore(security): residual Next advisories.** `next` is at **15.0.5**
  (CVE-2025-66478 RCE patched). `npm audit` still reports ~24 further
  advisories, several only fixed in **15.5.16+**, incl. **Authorization
  Bypass in Next.js Middleware** (GHSA-f82v-jwr5-mffw, directly relevant
  — `/dashboard` is middleware-gated), SSRF, cache-poisoning, XSS, DoS;
  npm also flags 15.0.5 for a later bundle. Fold a bump to latest
  patched 15.5.x into the deps upgrade; re-verify middleware auth +
  `serverExternalPackages` config.
- **ops note:** never run `npm run build` while `npm run dev` is active
  (shared `.next/` corrupts → `Cannot find module './NNN.js'`; recover:
  stop dev, `rm -rf .next`, restart).
- **Vercel MCP scope:** the Vercel MCP token is scoped to a different
  team than the CLI account (`qasimahmed4444s-projects`) — use the
  **Vercel CLI** for this project's deploy/log observation, not the MCP.
- **Vercel preview env-var scoping is per-branch — every new preview
  branch needs a one-time env replication.** Hit twice now
  (`brand/integrate-masaar-v1`, then `ui/landing-redesign-v1`).
  `NEXT_PUBLIC_*` is build-time inlined and the Vercel Preview vars are
  scoped to a *specific git branch*, so a fresh branch's preview builds
  with no env → `src/lib/env.ts` fail-fast throws in middleware →
  **500 `MIDDLEWARE_INVOCATION_FAILED`**. A healthy protected preview
  returns **401**, not 500. One-time fix per new branch
  (`vercel` CLI v53, from the masaar dir, replace `BRANCH`):
  ```
  vercel env add NEXT_PUBLIC_SUPABASE_URL preview BRANCH \
    --value https://hsnrupadmygkeirhujiv.supabase.co --yes
  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview BRANCH \
    --value <anon key from .env.local> --yes
  vercel env add NEXT_PUBLIC_APP_URL preview BRANCH \
    --value https://preview.invalid --yes
  vercel redeploy <latest BRANCH preview url>   # no --yes flag; redeploy rejects it
  ```
  Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Preview (attack
  surface). `NEXT_PUBLIC_APP_URL` is a deliberate `preview.invalid`
  placeholder (brand/visual review only; QR absolute-URL build is
  intentionally broken-but-obvious on previews). Longer-term fix under
  discussion (all-previews scope vs a `scripts/setup-preview-env.sh`
  vs preview-only graceful-degradation in `lib/env.ts`) — see the
  session report; not yet decided.
- **PR2 (RESOLVED, kept for history):** `vercel.json` multi-region
  `["fra1","bom1"]` is Pro-only and failed the Hobby deploy; pinned to
  single `bom1` (commit `fix(deploy): pin single region bom1`).
- **C5 (RESOLVED, kept for history):** `/login` `useSearchParams()`
  needed a `<Suspense>` boundary (Next 15 prerender) — missed in the
  Step-2 audit, found by `npm run build`, fixed by extracting
  `login-client.tsx`.

### Nice-to-fix from the Step-2 audit (deferred, untouched)
1. **Anon scan-insert spoofing / no rate limit** — `scans_anon_insert
   WITH CHECK (true)` + public anon key lets anyone write arbitrary
   `scans`. Revisit with rate limit or a SECURITY DEFINER insert RPC.
2. **shortId collision has no retry** — `api/qr` POST: unique-violation
   → generic 400, no retry loop.
3. **Analytics timezone bucketing** — `analytics-client.tsx` mixes local
   `Date` shift + UTC ISO slice; GMT+3 days can be off by one bucket.
4. **"Total scans" KPI capped at 5000** — `analytics/page.tsx`
   `.limit(5000)` silently undercounts; use a count RPC.
5. **Bots logged as scans** — crawler/link-preview hits to
   `/r/[shortId]` inflate analytics; filter known bot UAs.
6. **qr-preview mount race / stale closure** — `qr-preview.tsx` mount
   effect `[]` deps; first paint can be stale until next style change.
7. **Middleware runs on every route (P2)** — scope the matcher to
   `/dashboard` to drop an auth round-trip on public pages.
8. **Signup password has no client `minLength`** — label says 8+;
   Supabase default min is 6.
9. **`profiles` has no INSERT policy** — relies solely on the
   `handle_new_user` SECURITY DEFINER trigger.
10. **Lying Insert/Update types (T2)** — `database.ts` `Partial<Row>`
    for Insert/Update; resolved by the deps regen above.
11. **Unsafe `as` style casts** — `qr.ts` / `qr-preview.tsx` cast
    arbitrary strings to qr-code-styling unions.
12. **vercel.json regions don't pin the edge route (PR2-adjacent)** —
    `/r/[shortId]` edge route would need `export const preferredRegion`.
13. **next.config deprecated key (PR3)** — `experimental.
    serverComponentsExternalPackages` → top-level
    `serverExternalPackages` in Next 15 (warns each build; the
    "required on server" comment is wrong, `qr.ts` is browser-only).
14. **Static-QR destination not immutable server-side** — PATCH would
    accept a `destination` change on a static row; enforce kind-aware
    immutability in `api/qr`.
15. **No client-side length cap** — E1 added server-side caps; a
    matching client `maxLength` on URL/text inputs is a UX nicety.

## 5. Session A.7 follow-ups (frictionless checkout)

- **Post-checkout magic-link login setup** — newly auto-created
  accounts currently learn to log in via the welcome email's
  magic-link note. Nicer: a one-time post-checkout link that sets up
  future logins without rerouting through the email gate. (v1 chose
  the simpler "log in next time via magic link" per spec.)
- **Resend integration with branded bilingual templates** — wire a
  real `RESEND_API_KEY` (account + verified domain) and replace the
  plain HTML with a branded EN/AR template + plain-text fallback.
  A test key is now in all 3 Vercel scopes; lib/email.ts auto-switches
  from stub to real send when the key starts with `re_`.
  **Default-sender restriction (test-mode):** while sending from
  Resend's default `onboarding@resend.dev`, deliveries land **only at
  addresses verified in the Resend dashboard** — i.e. only Usama's
  verified mailbox (and `+alias` variants that route to the same
  inbox). Other recipients are silently dropped by Resend. When a
  real domain is verified in Sprint 3, this restriction lifts. The
  test key is to be rotated then too.
- **Anti-fraud on anon checkout** — `/api/checkout/anon` is an
  account-creation endpoint; abuse vector. Current guard is an
  approximate per-IP rate limit reusing `creator_ip_hash` (no
  dedicated table). Add a real rate-limit table + CAPTCHA on the form
  in Sprint 3 if abuse appears.
- **SUPABASE_SERVICE_ROLE_KEY scope (Sprint 3 hardening)** — the
  service-role key is currently in the Vercel **Preview** scope
  (all branches) so anon-checkout / render.png / anon-email routes
  work on previews. This widens the preview attack surface. Rotate
  and/or restrict the key post-launch; ideally move privileged ops
  behind narrowly-scoped SECURITY DEFINER RPCs so previews don't need
  the raw service-role key.
- **`subscription_status='active'` on a brand-new profile is a stub**
  — set unconditionally at anon checkout while `PAYMENTS_ENABLED=false`.
  When real payments wire up (Sprint 3) this must only be set on a
  verified payment webhook, not at account creation.
- **JWT role validation at app startup (Sprint 3 hardening — bumped).**
  A.7 had TWO related env failures masked by insufficient verification:
  (1) the Vercel `SUPABASE_SERVICE_ROLE_KEY` value was originally the
  anon JWT (both are `eyJ…`); Supabase REST returned an opaque 400
  `"Invalid API key"`. (2) Production scope was missing the key
  entirely, but my post-A.7 verification used an empty-body POST that
  failed at email-validation *before* the admin client constructed,
  hiding the 503. Two complementary checks:
  - **App-level**: in `lib/supabase/admin.ts` (or a boot guard),
    decode the SERVICE_ROLE_KEY payload (no signature verify needed —
    we don't trust it, just inspect), assert `role === "service_role"`,
    throw a clear error on mismatch. Same for anon (`role === "anon"`).
    Catches wrong-paste at first call instead of during a smoke.
  - **CI-level**: before promoting to production, run a
    `vercel env ls production` check that asserts
    `SUPABASE_SERVICE_ROLE_KEY` is present in the Production scope.
    Would have caught the prod-missing-key gap pre-merge.

## 6. Session B follow-ups (visual upgrade)

- **Mobile sidebar drawer.** The deep-teal `Sidebar` is `hidden
  lg:flex` on the Overview / qr-codes / per-QR-analytics pages. At
  <lg the `MobileTopBar` (back link + page label) is the only nav.
  A proper slide-out drawer with the full nav + plan card would close
  the gap. Phase-1.5 trade-off — not blocking.
- **`SECURITY DEFINER` RPC to replace admin-client `recentQrCount`.**
  `/checkout/[shortId]` calls `createAdminClient()` to count 24h-old
  QRs for the social-proof card. This widens preview/prod attack
  surface (pairs with §5 "rotate / restrict service-role key"). A
  SECURITY DEFINER function
  `count_recent_qrs(since timestamptz) returns int` with
  `GRANT EXECUTE ... TO authenticated, anon` lets the regular Supabase
  client run it without the service-role key. Same pattern as
  `resolve_qr_v2` / `create_anon_qr` / `claim_draft_qrs` (migrations
  005–009).
- **Custom date-range picker on analytics filter pills.** Stretch
  goal from Phase 1. Add a "Custom range" pill that opens a date
  picker; URL params become `?from=…&to=…` alongside `?period=`.
- **Trend-chart polish.** Spike annotations (top 3 days marked),
  X-axis tick density per period (every 7d for 30d, every 30d for 90d,
  monthly for all-time), hover tooltip restyle. Phase 1 nice-to-haves.
- **`window.location.search` reader bug class.** Almost shipped a
  `bundle_period_safe()` helper that read URL params on every render —
  would have been an SSR/CSR mismatch (the server has no `window`).
  Add a lint rule (or a CLAUDE.md note) that any `window.*` read in a
  client component must be inside `useEffect` (or SSR-safe via
  `typeof window` check).
- **Hydration-mismatch lint.** Same family as the previous item. Any
  `Math.random()`, `Date.now()`, `new Date()` in a JSX expression
  should be flagged (or required to be wrapped in a stable seed).
  Phase 2 hydration nit (`9d15b7e`) prompted this.
- **Real PayPal / Google Pay / Mada wiring (Sprint 3).** All three
  payment buttons currently route through the same flag-off endpoint.
  `TODO(Sprint 3)` comments mark the gateway routing locations. PayPal
  = PayPal SDK, GPay = Google Pay JS API, Card = Tap Payments /
  HyperPay / Mada per STRATEGY.md §5. Decision pending on whether to
  surface Card-first (regional dominant method) instead of PayPal-first
  for the Saudi launch.
- **Brand-safe GPay mark.** The black GPay button shows a stylized "G"
  in a white circle, NOT the real Google "G" logo (can't ship the real
  one without brand permission). Sprint 3 should either get Google Pay
  brand-asset approval or keep the placeholder.
- **Testimonial system.** The 4 checkout testimonials are all
  `Example`-tagged placeholders. Build a simple
  `testimonials(id, name, city, body, rating, when_text, approved bool)`
  table; replace the static array once real entries land. The
  "Example" tag stays on any un-approved entries.
- **`text-sea-teal` typo class (lint).** Tailwind doesn't fail on
  unknown utility classes — they're silently dropped. Almost shipped
  `text-sea-teal` in Phase 2 (the brand-palette mental model uses
  "sea-teal" but `tailwind.config.ts` exposes it as
  `deep-teal-light`). Add the
  [tailwindcss/no-custom-classname](https://github.com/francoismassart/eslint-plugin-tailwindcss)
  rule (or equivalent) to catch typos at lint time.

## 7. Session B.5 follow-ups (UX polish pass)

- **Full per-account activity feed page.** B5/Item 7's "View all
  activity →" currently routes to `/dashboard/qr-codes` since no
  dedicated activity page exists. Build `/dashboard/activity` with
  paginated scan list across all QRs, filterable by QR / period /
  device / country. Sprint 3.
- **Migrate `/dashboard/qr/new` off DashboardShell** — or delete it
  outright. The route still works but is not linked from any active
  navigation; B5/Item 6 explicitly took it out of minimum scope.
- **Auth-aware MarketingShell.** /about, /pricing, /product, /privacy,
  /terms, /resources, /solutions still use the static MarketingShell
  with a single "Create QR" CTA regardless of session. Mirror the
  landing's SiteHeader auth-aware treatment (HeaderLoginButton →
  HeaderProfileMenu when authed) for consistency across the
  public-site surfaces.
- **Real QR thumbnails on BestPerformingTable.** B5/Item 10 wired
  `<QrThumb />` into the right rail (36px) and `/dashboard/qr-codes`
  grid (56px). The Best Performing Codes table on the Overview kept
  its placeholder icon — extend with the same pattern.
- **Preserve error-context on /login → / redirect.** Bug 14 deleted
  /login and added a static redirect. `/auth/claim` 303s like
  `/login?error=missing_code` / `?error=link_expired` now lose their
  context. Surface as a `?login_error=...` query on / and have
  HeaderLoginButton read it to auto-open the modal with an inline
  error message.
- **CAPTCHA on /contact form (Sprint 3).** Migration 011's
  `submit_contact_request` enforces an approximate per-IP rate limit
  (3/hr) reusing the ip-hash pattern, but a real launch should add
  hCaptcha or Cloudflare Turnstile to defend against bot floods.
- **Profile picture upload + display name change in Settings (Sprint 3).**
  B5/Item 12 only shipped email + password change forms. Add full_name
  edit + avatar upload (Supabase Storage `avatars` bucket).
- **Two-factor auth (Sprint 3+).** Explicitly flagged out of scope in
  the B5 spec; logging here so it doesn't get forgotten.
- **Sidebar `current="edit"` state on /dashboard/qr/[id].** Currently
  shows QR Codes as the active nav item while editing. Could be
  argued either way; flagging for a future opinion.
- **Portal EmailGateModal too.** B5/Bug 15 portal-fixed
  HeaderLoginButton because SiteHeader has `backdrop-blur` creating a
  containing block for fixed children. EmailGateModal currently works
  (wizard root has no blur parent) but is defenseless if the wizard
  layout ever gets a blur surface. Defensive portal would prevent the
  regression.
- **/contact notification email is undeliverable while Resend is in
  test mode.** Goes to `hello@masaar.sa` which isn't a verified
  Resend dashboard address — so the email gets silently dropped per
  the documented test-mode caveat (§5). Row still lands in
  `contact_requests` (the source of truth). Real domain in Sprint 3
  lifts the restriction; the test key needs rotation at the same time.
- **`subscription_status` plan tier in the Sidebar plan card.** The
  card maps `subscription_status='active'` → "Pro" with a 5000-QR
  limit and anything else → "Free" with a 5-QR limit. Once real
  billing wires up, expand the mapping to read actual plan names
  (Starter / Pro / Menu Pro / Agency per STRATEGY.md §5).
