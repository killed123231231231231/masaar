# Masaar — Backlog

Deferred items found during the Step 2 audit / Step 3 fix pass. None of these
block production; they are logged here intentionally and left untouched.

## Deferred deps work

### chore(deps): coordinated upgrade — @supabase/ssr → latest + @supabase/supabase-js → latest + regenerate database.ts

- **Why deferred:** `@supabase/supabase-js` is pinned to exactly `2.45.4`
  (no caret) because `@supabase/ssr@0.5.2` expects `^2.43.4` and npm's `^`
  had drifted supabase-js to `2.105.4`, whose evolved typed-client contract
  collapsed every typed query to `never`. Pinning is a stopgap.
- **Do this AFTER Step 4** (Supabase provisioned) so `src/types/database.ts`
  can be regenerated from the live schema via
  `npx supabase gen types typescript --project-id <ref>` instead of being
  hand-written.
- **Scope:** bump `@supabase/ssr` to latest + `@supabase/supabase-js` to
  latest as a coordinated pair, regenerate `database.ts`, then remove the
  exact pin.
- **Risk to review during the bump:** the `@supabase/ssr` cookie API
  surface changed across 0.5 → 0.7 (`getAll`/`setAll` shape). Re-verify
  `src/lib/supabase/server.ts` and `src/lib/supabase/middleware.ts` after
  upgrading.
### chore(security): residual Next.js advisories after the CVE-2025-66478 patch

- **Done:** `next` bumped 15.0.3 → **15.0.5** (commit
  `fix(security): bump next to 15.0.5 for CVE-2025-66478`), which fully
  resolves the CVSS 10.0 RCE per the vendor advisory.
- **Still open (needs sign-off, out of scope for the audit pass):**
  `npm audit` reports ~24 further `next` advisories at 15.0.5, several
  only fixed in the 15.5.16+ line, including:
  - **Authorization Bypass in Next.js Middleware** (GHSA-f82v-jwr5-mffw,
    `>=15.0.0 <15.2.3`) — directly relevant: Masaar gates `/dashboard`
    in `middleware.ts`.
  - SSRF via middleware redirects, multiple cache-poisoning, App Router
    XSS, and several DoS advisories.
  - npm also flags 15.0.5 itself for a later bundle
    (nextjs.org/blog/security-update-2025-12-11).
- **Recommendation:** fold a Next upgrade to the latest patched 15.5.x
  into the coordinated deps upgrade above (after Step 4), and re-verify
  middleware auth + the deprecated `serverExternalPackages` config.

## Ops notes

- **ops: never run `npm run build` while `npm run dev` is active** — they
  share `.next/` and corrupt each other (manifests in `Cannot find module
  './NNN.js'` + `/_next/static/*` 404s). If it happens: stop dev, delete
  `.next/`, restart dev. Run the build gate with the dev server stopped.

## Deploy follow-ups / status

- **PR2 RESOLVED** — `vercel.json` was `regions:["fra1","bom1"]`;
  multi-region serverless is Pro/Enterprise-only and failed the Hobby
  deploy. Pinned to single `bom1` (commit `fix(deploy): pin single
  region bom1`). No longer a nice-to-fix.
- **deploy: wire Git auto-deploy (needs your Vercel dashboard action).**
  The Vercel project is under `qasimahmed4444s-projects`; the GitHub repo
  is `killed123231231231231/masaar` (now public). `vercel git connect`
  fails from the CLI because the Vercel GitHub App isn't installed/
  authorized on the `killed123…` GitHub account for this Vercel account
  (cross-account). To enable push-to-deploy: Vercel dashboard → masaar →
  Settings → Git → Connect, completing the GitHub App authorize as the
  `killed123…` account. Until then, deploys are manual `vercel deploy
  --prod`.
- **note:** the Vercel MCP token is scoped to a different team than the
  CLI account (`qasimahmed4444s-projects`), so deployment/build-log
  observation must use the Vercel CLI, not the MCP, for this project.

## Auth follow-ups

- **auth: re-verify email confirmation flow on production URL before
  public launch.** The `masaar` Supabase project shipped with email
  confirmations OFF (auto-confirm); "Confirm email" was enabled manually
  in the Dashboard during Step 5. Before public launch, spot-check the
  full signup → real confirmation-email click → login path against the
  production Vercel URL (Site URL / Redirect URLs must include the prod
  domain, set in Step 7), not just localhost.

## Audit self-corrections

- **C5 — `/login` `useSearchParams()` not wrapped in `<Suspense>`**: missed
  in the initial Step 2 audit, found by `npm run build` (Next 15 prerender
  bailout fails the production build, which would have broken the Vercel
  deploy). Severity BLOCKER. Fixed in commit
  `fix(login): wrap useSearchParams in Suspense boundary` by extracting the
  client markup into `login-client.tsx` and wrapping it in
  `<Suspense fallback={null}>`. Logged here so the audit gap is documented,
  not hidden — type-checking alone would not have caught this; only a real
  build did.

## Nice-to-fix (from Step 2 audit) — deferred, not touched

These were logged and intentionally left alone per the Step 3 plan.

1. **Anon scan-insert spoofing / no rate limit** — `scans_anon_insert
   WITH CHECK (true)` (migration 001) + public anon key let anyone write
   arbitrary `scans` rows (fake geo, inflated counts) directly, bypassing
   `/r/[shortId]`. Inherent to the anon-insert design; revisit with a
   rate limit or a SECURITY DEFINER insert RPC.
2. **shortId collision has no retry** — `api/qr` POST: a unique-violation
   on `short_id` returns a generic 400 with no retry. Probability is tiny
   (~54^7) but a single retry loop would be more robust.
3. **Analytics timezone bucketing** — `analytics-client.tsx` builds the
   30-day series by shifting a local `Date` then slicing the UTC ISO
   string; for GMT+3 (KSA) some days can be off by one bucket.
4. **"Total scans" KPI capped at 5000** — `analytics/page.tsx` does
   `.limit(5000)`; the KPI and series silently undercount past 5000.
   Use a count query / RPC for the headline number.
5. **Bots logged as scans** — link-preview/crawler hits (WhatsApp, Slack,
   Apple, facebookexternalhit) to `/r/[shortId]` are logged as real
   scans, inflating analytics. Filter known bot UAs.
6. **qr-preview mount race / stale closure** — `qr-preview.tsx` mount
   effect has `[]` deps; if `style` changes before `createQr` resolves
   the first paint can be stale until the next style change.
7. **Middleware runs on every route (P2)** — `middleware.ts` calls
   `getUser()` for the marketing landing and all API routes. Scope the
   matcher to `/dashboard` to drop an auth round-trip from public pages.
8. **Signup password has no client minLength** — `signup/page.tsx` label
   says "8+ chars" but there's no `minLength`; Supabase default min is 6.
9. **`profiles` has no INSERT policy** — relies solely on the
   `handle_new_user` SECURITY DEFINER trigger; if the trigger ever fails,
   signup errors with no fallback.
10. **Lying Insert/Update types (T2)** — `database.ts` still uses
    `Partial<Row>` for Insert/Update, so omitting NOT NULL columns
    compiles but fails at runtime. Resolved properly by the
    regenerate-types deps item above (run after Step 4).
11. **Unsafe `as` style casts** — `qr.ts` / `qr-preview.tsx` cast an
    arbitrary string to the qr-code-styling option unions; a bad value
    persisted in the DB could throw at render. UI constrains it today.
12. **vercel.json regions don't pin the edge route (PR2)** — `regions:
    ["fra1","bom1"]` affects serverless functions; the `/r/[shortId]`
    edge route needs `export const preferredRegion` to be pinned.
13. **next.config deprecated key (PR3)** — `experimental.
    serverComponentsExternalPackages` was renamed to top-level
    `serverExternalPackages` in Next 15; build emits a warning each run.
    (Also the "required on server" comment is wrong — `qr.ts` is
    browser-only.)
14. **Static-QR destination not immutable server-side** — the edit UI
    disables the field for static QRs and CLAUDE.md says static QRs
    can't be edited, but PATCH would still accept a `destination` change
    for a static row. Enforce kind-aware immutability in the API.
15. **No client-side length cap** — E1 added the server-side caps
    (the security boundary); a matching client-side maxLength on the
    URL/text inputs would be a UX nicety.

