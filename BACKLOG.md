# Masaar — Backlog

Pending work, grouped by urgency. Snapshot: 2026-05-17.

## 0. Blocking the brand-branch merge (do first)

- **Preview 500 `MIDDLEWARE_INVOCATION_FAILED`.** The 3 env vars
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_APP_URL`) are **Production-scoped only** (`vercel env ls`).
  Vercel preview builds run in production mode with **no** env in that
  scope → `src/lib/env.ts` `requireProdEnv()` throws → fails in
  `src/middleware.ts`. **Fix:** add the 3 vars to the **Preview** (and
  Development) scope, redeploy `brand/integrate-masaar-v1`, then the user
  can eyeball the preview. `vercel env add NEXT_PUBLIC_SUPABASE_URL
  preview` (×3; preview `NEXT_PUBLIC_APP_URL` = the branch preview alias).
  Prod is unaffected. Until fixed, the brand preview cannot be reviewed.

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
2. **Live scan feed** — Supabase Realtime on `scans`.
3. **Frames** around the QR — `frame_style` / `frame_text` columns ready.
4. **Password-gated QRs** — `password_hash` column ready.
5. **PDF export** — `pdf-lib` already a dep.
6. **Folders UI** — `folders` table ready.
7. **Full UI redesign** matching `brand/07-landing-page-hero-mockup.png`
   — 3-step wizard, new dashboard, new content types
   (WhatsApp / PDF / Image / Video / App Link). Big; explicitly out of
   scope until prioritized.
8. **Arabic translation + RTL** — `next-intl`, `dir="rtl"`; Plex Arabic
   font already wired.

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
