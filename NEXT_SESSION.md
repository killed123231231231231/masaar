# NEXT SESSION — handoff

_Snapshot: 2026-05-17. Read this first, then `CLAUDE.md` → "Session
history & current state", then `BACKLOG.md`._

## Where we are right now

Masaar (Next.js 15 + Supabase + Vercel QR SaaS) is **live and working in
production** at https://masaar-zeta.vercel.app off `main` (HEAD
`e140b93`) — full dynamic-QR flow verified by prod smoke test. A
**brand-integration branch `brand/integrate-masaar-v1`** (HEAD
`c3107b2`, 8 commits, **not merged**) adds the logo, palette
(deep-teal/terracotta/sand/charcoal), fonts (Manrope/Inter/IBM Plex
Sans Arabic), favicons, copy and tier-1 polish. Its Vercel **preview is
currently broken** — `500 MIDDLEWARE_INVOCATION_FAILED` — because the
Vercel env vars are Production-scoped only and previews get none, so
`src/lib/env.ts` fail-fast throws in middleware. The very last commit on
this branch (this docs snapshot) is **not pushed**; the user reviews the
3 docs first.

## Get to the right state

```
cd C:/Users/masim/Downloads/masaar
git checkout brand/integrate-masaar-v1   # already here; do NOT merge to main without user OK
git status                               # expect clean (after the docs commit)
git log --oneline -1                     # docs: snapshot session state for context handoff
```
Vercel/CLI is the `qasimahmed4444` account (`vercel whoami`); use the
**Vercel CLI**, not the Vercel MCP (MCP is scoped to a different team).
GitHub is now the `killed123231231231231` account, synced to the masaar
Vercel project. Supabase ref `hsnrupadmygkeirhujiv` (region
`ap-south-1`). `.npmrc` pins `legacy-peer-deps=true`; `supabase-js`
pinned exactly `2.45.4` — `npm install` as-is, don't "fix" the pin.

## Read these 5 first

1. **`CLAUDE.md`** — project rules + the appended "Session history &
   current state" (full context, decisions, the why).
2. **`BACKLOG.md`** — pending work; **§0 is the immediate blocker**
   (preview 500) with the exact fix.
3. **`NEXT_SESSION.md`** — this file.
4. **`src/lib/env.ts`** — the lazy fail-fast env validation that throws
   when `NEXT_PUBLIC_*` is missing (root cause of the preview 500).
5. **`src/middleware.ts`** (+ `src/lib/supabase/middleware.ts`) — where
   that throw surfaces (Supabase client created on every request at the
   edge).

## Next 3 actions, in order

1. **Fix the preview 500.** Add the 3 vars to the **Preview** (and
   Development) Vercel scope, then redeploy the branch and confirm the
   preview alias returns 200:
   `vercel env add NEXT_PUBLIC_SUPABASE_URL preview` (value =
   `https://hsnrupadmygkeirhujiv.supabase.co`),
   `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview` (value from
   local `.env.local`),
   `vercel env add NEXT_PUBLIC_APP_URL preview` (value = the branch
   preview alias
   `https://masaar-git-brand-integrate-masaar-v1-qasimahmed4444s-projects.vercel.app`).
   Push triggers a Git preview build; or `vercel deploy` (not `--prod`).
2. **Get the user's eyeball + merge approval** on the fixed preview.
   Only on explicit go-ahead: merge `brand/integrate-masaar-v1` → `main`
   and push (the Git integration will deploy prod). Push the docs
   snapshot commit too once the user has reviewed the 3 files.
3. **After merge:** confirm prod (`masaar-zeta.vercel.app`) reflects the
   brand; then pick up `BACKLOG.md` — §1 launch-blockers (email-confirm
   re-verify, purge test data, domain) or §3 follow-up sessions
   (logo-upload is #1) per the user's priority.

## In-flight gotchas (honest)

- **Docs snapshot commit is NOT pushed** — user reviews `CLAUDE.md` /
  `BACKLOG.md` / `NEXT_SESSION.md` first. Working tree is otherwise
  clean.
- **Brand branch is NOT merged.** Do not merge without explicit user
  approval.
- **Preview is broken** (env scope) — must be fixed before the user can
  review the brand work. Production is fine (its vars are
  Production-scoped).
- **Live Supabase has test data** (2 real test users + their QRs +
  scans) — intentional Step-8 baseline, do NOT treat as a bug; purge is
  a launch-blocker the user will time.
- **Vercel env vars are per-environment-scope** — Production-scoped vars
  do not apply to Preview/Development (this is the whole bug).
- **`brand/` is gitignored** (~13 MB reference PNGs not in the repo);
  the user converts assets to SVG externally and hands them over —
  fastest path (autotrace tools unavailable in-session).
- **`next@15.0.5`** still carries ~24 advisories incl. a middleware
  auth-bypass — known/deferred (BACKLOG §4), needs sign-off.
- Prod was a **CLI direct-upload** deploy, not SHA-pinned to `e140b93`
  (docs-only commits since; functionally == main).
- `preview_screenshot` (Claude_Preview MCP) times out in this
  environment; verify visuals via `preview_eval` (canvas / computed
  styles). `localhost`/`file://` are blocked for the claude-in-chrome
  extension (only the granted prod domain works there).
