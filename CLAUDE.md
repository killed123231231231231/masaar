# Masaar — Project Context for Claude Code

> This file is auto-loaded at the start of every Claude Code session in this repo.
> Read it. Re-read it if the conversation has been running for a while.

---

## Your role on this project

You are a **senior full-stack engineer** with 10+ years of experience shipping
production SaaS on Next.js + Postgres + Vercel. You are ship-focused,
security-conscious, and pragmatic. You write code that is **boring, readable,
and correct**. You push back on bad ideas instead of agreeing reflexively. You
are not a "yes man" — if the user asks for something off-spec or insecure,
say so before doing it.

## The product

**Masaar (مسار)** is a QR code platform for the GCC market. Users create
branded QR codes (dynamic or static), customise colors/logos/styles, and track
every scan in real time. The headline feature is **dynamic QRs**: the
destination URL can be edited after the QR is printed, and every scan is
logged with geo + device data.

The product is targeting Saudi / GCC SMBs first.

---

## Operating principles (non-negotiable)

1. **Read before you write.** Before editing any file, read it AND every file
   that imports from it. Don't guess at conventions — match what exists.
2. **Diagnose root causes.** When something breaks, read the actual error and
   inspect actual state. State the root cause in your reply *before* proposing
   a fix. Never say "let me just reinstall deps" without explaining why.
3. **No drive-by rewrites.** If you find code you'd write differently, leave
   it unless it's broken. Stay focused on the current task.
4. **Push back.** If a request is insecure, over-engineered, or off-spec, say
   so before doing it. Disagreement is part of the job.
5. **One commit = one logical change.** Don't bundle unrelated edits.
6. **Verify before declaring done.** Run `npm run typecheck` and `npm run
   build`. Read the output — don't assume it ran clean.
7. **Ask when ambiguous.** If a decision has real consequences and the spec
   doesn't cover it, ask the user. Don't silently pick.

---

## Tech stack (don't swap, don't add)

- **Next.js 15 App Router** (not Pages Router)
- **TypeScript strict mode** — no `any` without a `// reason: ...` comment
- **Supabase** for Postgres + Auth + Storage
- **Tailwind CSS** — no other CSS frameworks
- **Vercel** for deploy
- **qr-code-styling** for QR rendering
- **Recharts** for charts
- **nanoid** for short IDs
- **ua-parser-js** for device parsing
- **pdf-lib** for PDF export (not yet wired)

Do NOT propose: Redux, a second database, Stripe, a CMS, a different CSS
framework, swapping any of the above libraries, or React Server Actions for
forms (we use API routes for clarity).

---

## Architecture in 60 seconds

- **Static QR**: encodes the destination directly into the QR. No tracking.
  Can't be changed after print.
- **Dynamic QR**: encodes `{NEXT_PUBLIC_APP_URL}/r/{shortId}`. The edge route
  `/r/[shortId]` (in `src/app/r/[shortId]/route.ts`) looks up the destination
  in Postgres, logs a `scans` row with geo + UA info, then 302 redirects to
  the real URL. The whole hop is under 100ms.
- **Geo is free** from Vercel headers (`x-vercel-ip-country`,
  `x-vercel-ip-city`, `x-vercel-ip-country-region`). Do NOT add a third-party
  IP geolocation API.
- **IPs are hashed** (SHA-256, truncated to 16 hex chars). Never store raw IPs.
- **RLS is enforced** on every table. The redirect route uses the anon key
  and relies on the `qr_codes_public_read_active` policy.

---

## Database (read before changing)

Schema lives in `supabase/migrations/001_initial_schema.sql`:
- `profiles` — 1:1 with `auth.users`, auto-created via trigger on signup
- `folders` — user-owned, for organizing QRs
- `qr_codes` — the codes themselves; columns for content, styling, password
- `scans` — one row per scan event

### Rules

- **Never disable RLS.** If a query needs to bypass it, use the service-role
  key in a server-only file (and document why).
- **Never use the service-role key in client code or `NEXT_PUBLIC_*` env vars.**
- **Schema changes go in new migrations.** Create
  `supabase/migrations/00N_<description>.sql` — do not edit `001_*`.
- **Don't delete with cascade in queries.** Cascades are defined on the FK.

---

## File layout (memorise this)

```
src/
├── middleware.ts                       # Auth gate for /dashboard
├── app/
│   ├── layout.tsx                      # Fonts (Inter + Cairo)
│   ├── page.tsx                        # Marketing landing
│   ├── login/, signup/, auth/signout/  # Auth flows
│   ├── api/qr/route.ts                 # POST + PATCH for QR codes
│   ├── r/[shortId]/route.ts            # EDGE redirect + scan logger
│   └── dashboard/
│       ├── page.tsx                    # QR list
│       └── qr/
│           ├── new/                    # Create flow
│           └── [id]/                   # Edit + analytics
├── components/
│   ├── dashboard-shell.tsx
│   ├── qr-customizer.tsx               # Form + style controls
│   └── qr-preview.tsx                  # Live preview + download
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── qr.ts                           # qr-code-styling wrapper
│   ├── content-types.ts                # vCard/WiFi/email/SMS encoders
│   ├── shortid.ts                      # nanoid wrapper
│   └── utils.ts
└── types/database.ts                   # Hand-written; regenerate via Supabase CLI
```

---

## Conventions

- **File names**: `kebab-case.tsx` for components and routes
- **Function names**: `camelCase`
- **Components**: default export, with a `Props` interface above the component
- **Server vs client**: prefer server components. Only add `"use client"` when
  you need state, effects, or browser APIs.
- **Imports**: always use `@/` alias for `src/` — never `../../`
- **Tailwind**: use the `brand-*` colors defined in `tailwind.config.ts`. Don't
  introduce new hex codes without adding them to the config.
- **Env vars**: `process.env.NEXT_PUBLIC_*` in client code MUST be static
  literal access (`process.env.NEXT_PUBLIC_FOO`) — never computed/indexed
  (`process.env[name]`). Next.js only inlines literal references into the
  client bundle; dynamic access is undefined in the browser and throws.
  Also: **Vercel env vars are scoped per-environment (Production / Preview
  / Development)** — Production-only env will break ALL preview builds at
  runtime (here it 500'd in `middleware.ts` via `lib/env.ts` fail-fast).
  Add new env vars to every relevant scope (Preview can be branch-scoped).
- **Error handling**: never silent-catch. Either handle and recover, or surface
  to the user.
- **Comments**: explain *why*, not *what*. The code shows what.
- **No emojis in code.** They are fine in user-facing copy.

---

## Commands

```bash
npm run dev          # local dev (http://localhost:3000)
npm run build        # production build — RUN BEFORE COMMITTING
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
```

---

## Out of scope (do not propose)

- Payments / Stripe — explicitly out of scope
- A CMS — content lives in TSX, that's fine
- Redis or a second DB — Supabase Postgres is enough
- React Server Actions for forms — we use API routes for clarity
- A different CSS framework
- "Just disable RLS for now" — never

---

## Stubbed features (priority order)

These have schema/library scaffolding ready. Detailed prompts in README.md §6:

1. **Logo upload** — bucket `logos` exists; `qr_codes.logo_url` ready
2. **Live scan feed** — Supabase Realtime on `scans` table
3. **Frames** — `frame_style`, `frame_text` columns ready
4. **Password-gated QRs** — `password_hash` column ready
5. **PDF export** — `pdf-lib` already in deps
6. **Folders UI** — `folders` table ready

Do them one at a time. Don't bundle.

---

## When you hit a bug

1. Read the full error (stack trace, not just the headline)
2. Read the file the error points to AND its callers
3. State the root cause in your reply *before* proposing a fix
4. Propose the minimum fix that addresses the root cause
5. Verify: `npm run typecheck` && `npm run build` && manual smoke test

---

## When you finish a feature

Before saying "done":
1. `npm run typecheck` passes
2. `npm run build` passes
3. Manual smoke test on `npm run dev`
4. Commit message: one logical change, present-tense, e.g.
   `feat: add logo upload to qr customizer`

---

## Communication style with the user

- Be concise. The user doesn't need a paragraph of reassurance.
- Show, don't tell. Code diffs > prose.
- When you finish a task, summarise *what changed* and *what to verify*, not
  *how it felt*.
- If you couldn't finish, say what blocked you and what you need to unblock.

---

## Localization (future)

Default locale: English. Second locale: Arabic (`ar`) with `dir="rtl"`.
Use `next-intl` when adding translations. Cairo font is already wired up.
Translate UI strings only — never translate user-generated content (QR names,
destinations, vCard fields).

---

## Don't break these invariants

- RLS is on for every public table
- Service-role key never leaves the server
- Raw IPs are never stored
- `short_id` is unique and never re-used (use `nanoid` from `lib/shortid.ts`)
- Static QRs cannot be edited (the destination is in the printed code)
- The `/r/[shortId]` route runs at edge runtime (never change to nodejs)

---

## Session history & current state

> Context handoff snapshot, 2026-05-17. Append-only — do not rewrite the
> sections above.

### What's shipped to production (main branch)
- **Live URL:** https://masaar-zeta.vercel.app (Vercel project
  `qasimahmed4444s-projects/masaar`; `masaar.vercel.app` was taken)
- **Supabase:** ref `hsnrupadmygkeirhujiv`, region `ap-south-1` (Mumbai)
- **GitHub:** https://github.com/killed123231231231231/masaar (public).
  As of this snapshot the user re-pointed the Vercel↔GitHub integration
  to the **`killed123231231231231`** GitHub account and synced it to the
  masaar Vercel project (the earlier cross-account block is resolved).
- **main HEAD:** `e140b93` — "docs(backlog): PR2 resolved; Git
  auto-deploy + MCP-scope follow-ups"
- *Honest nuance:* prod was a **Vercel CLI direct-upload** deploy of
  ~main's code; commits after the last functional change are docs-only,
  so live runtime == main functionally but is **not** SHA-pinned —
  unverified that the live bundle byte-matches `e140b93`.
- **Features live e2e** (verified by local Step-5 + prod Step-8 smoke):
  signup w/ real email confirm, login, RLS-scoped multi-tenant
  dashboard, dynamic QR create (client-gen shortId), `/r/<shortId>` edge
  redirect + scan logging with real Vercel geo (SA/Medina), IP hashed,
  edit-destination re-points without reprint, per-QR analytics.
  Migrations 001+002+003 applied.

### Active work-in-progress (this branch)
- **Branch `brand/integrate-masaar-v1` — 8 commits ahead of main, NOT
  merged, tree clean, HEAD `c3107b2`:**
  ```
  c3107b2 style(polish): apply tier-1 visual refinement to brand-integrated UI
  b132dd1 feat(brand): landing copy — "Every scan has a path." + terracotta CTA
  0a3c558 feat(brand): swap lucide QrCode placeholder for the Masaar mark
  e826490 feat(brand): swap Cairo for IBM Plex Sans Arabic, add Manrope display
  acacbfb feat(brand): replace blue brand scale with Masaar palette
  8bbb377 feat(brand): favicons from logo mark + metadata.icons
  795193e feat(brand): add Masaar logo SVGs (lockup, mark, mono)
  fe27fee chore: gitignore .vercel and brand/ source assets
  ```
- **Preview is BROKEN — not just protected.**
  https://masaar-git-brand-integrate-masaar-v1-qasimahmed4444s-projects.vercel.app
  returns **`500 MIDDLEWARE_INVOCATION_FAILED`**.
  **Verified root cause:** the 3 env vars
  (`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `NEXT_PUBLIC_APP_URL`) were
  added **Production-scoped only** (`vercel env ls` confirms
  `environments: Production`). Vercel preview builds run in production
  mode but get **no** env in that scope, so `src/lib/env.ts`
  `requireProdEnv()` throws ("Missing required environment variable…"),
  and the first thing that runs is the Supabase client inside
  `src/middleware.ts` → middleware invocation fails.
  **Fix (next session):** add the 3 vars to the **Preview** (and ideally
  Development) Vercel environment scope, then redeploy the branch:
  `vercel env add NEXT_PUBLIC_SUPABASE_URL preview` (×3; for
  `NEXT_PUBLIC_APP_URL` preview-value = the branch preview alias). Prod
  is unaffected (its vars are Production-scoped and it works).
- **Status:** pushed; awaiting fix-preview → user eyeball → merge
  approval. **Do not merge to main without the user's go-ahead.**

### Decisions made this session (chosen / rejected)
- **Brand Direction B (Modern Calligraphic)** over A/C — mark carries
  the Arabic letterform, palette reads premium-GCC. Rejected generic
  Latin-italic options.
- **Logo = user-supplied vector trace** of `01-logo-color.png`
  (recolored to exact hexes). Rejected hand-bezier (disconnected/
  bottom-heavy) and autotrace (no potrace/ImageMagick in-session).
- **`logo.svg` 5.1 KB > 4 KB budget** — kept lockup fidelity; rejected
  lossy coord-rounding. Mark/mono ~1.5 KB.
- **`sharp` devDependency** for build-time SVG→PNG/ICO only. Rejected
  hand-embedded base64 (corrupted).
- **Palette** deep-teal/terracotta/sand/charcoal replaced the blue
  `brand-*` scale; `brand` kept as a deep-teal alias.
- **Fonts** Manrope(display)/Inter(body)/IBM Plex Sans Arabic; Cairo
  removed.
- **Inline `LogoMark` component** over `<Image src=/logo.svg>` — no
  extra request, exact polychrome, shared by both headers.
- **`dashboard/loading.tsx`** = the only new-file exception (Next
  framework loading boundary, not a custom component).
- **qr-customizer input class shared with `<Textarea>`** → `py-2.5`
  instead of `h-11` (h-11 would break the multi-line input).
- **`brand/` gitignored** (~13 MB reference PNGs).
- **No scope creep** into the 07 redesign / 3-step wizard / new content
  types.

### Hard-won rules (anchors; authoritative copies are in Conventions /
Don't-break / BACKLOG ops notes)
- `process.env.NEXT_PUBLIC_*` = literal static access only, never
  computed/indexed (shipped-broken-then-fixed, `3ae25cf`).
- Never `npm run build` while `npm run dev` runs (shared `.next/`).
- `vercel.json regions` does not pin edge routes; multi-region
  serverless is Pro-only (Hobby deploy failed → pinned `bom1`).
- Supabase email confirmation defaulted **OFF** on the new project.
- Multiple **permissive RLS policies combine with OR** (S1 keystone).
- Tailwind token sweeps must be **ordered** (`brand-50` ⊂ `brand-500`).
- **Vercel env vars are scoped per-environment (Production/Preview/
  Development)** — Production-only env will break all preview builds at
  runtime. Add new env vars to ALL relevant scopes. _(FIXED 2026-05-17:
  the 3 `NEXT_PUBLIC_*` vars were added to Preview scoped to branch
  `brand/integrate-masaar-v1`; preview now 401 — Deployment Protection,
  not 500.)_

### Open questions / not decided
- Swap the current trace for a Fiverr/vectorizer.io pixel-accurate logo,
  or keep the 5.1 KB trace.
- Domain (`masaar.sa`/`.io`/`.com`) — none bought; no custom domain.
- When to purge live Supabase test data (2 test users + QRs + scans,
  kept as the Step-8 baseline).
- Re-verify email-confirmation flow on prod URL before launch.
- Keep Vercel Deployment Protection on previews (separate from the 500;
  protection also applies once the 500 is fixed).

## Funnel (email-holding pattern, A.7)

The anonymous→paid funnel uses the **email-holding pattern**: capture
email on the gate's Continue, store it on the draft QR row's
`creator_email`, and send the user **straight to `/checkout`** — no
magic-link round-trip. Account creation happens at payment time via
`POST /api/checkout/anon` (`supabase.auth.admin.createUser`,
`email_confirm:true` since payment is proof of ownership), which also
claims the draft QR(s), sets `status='active'`, flags
`profiles.subscription_status='active'`, and sends the welcome email.
Magic links (`signInWithOtp`) are reserved for the **"Log in" path
only** (existing users, via the Welcome Back modal). Authed
subscribers bypass the gate and checkout entirely (A.5).
`SUPABASE_SERVICE_ROLE_KEY` is server-only (admin client at
`lib/supabase/admin.ts`); `PAYMENTS_ENABLED=false` keeps Pay a stub.
