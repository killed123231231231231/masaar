# NEXT SESSION — handoff

_Snapshot: **2026-06-02**. Read this first, then `SPRINT2_INDEX.md`, the
`SPRINT2.md` decision log, `BACKLOG.md`, and `STRATEGY.md` (long-form
market/product thesis)._

---

## Where we are right now

Masaar (Next.js **15.5.18** + Supabase + Vercel, GCC-market QR SaaS) is
**live in production** at https://masaar-zeta.vercel.app off `main`
(**HEAD `2208e21`**). Sprint-2 sessions **A → I** are merged (migrations
through **028**), plus **three post-sprint QA / polish / perf passes**
driven by Usama's live testing. The app is in strong shape end-to-end:
create → customize → download → dashboard → analytics → scan.

**What's live (high level):** anonymous-first 3-step create wizard (15+
content types — URL / vCard / Social / WiFi / Email / SMS / WhatsApp /
AppLink / Phone / Text + hosted PDF / Image / Video / Location / Feedback);
per-QR + account analytics; styled QR (dot / corner / gradient / logo); 16
frames + logo preset library + uploads; password-protected QRs; framed
PNG / SVG / **PDF** export; full edit page; **Active/Inactive toggle with
full inactive-lock**; anonymous create → email-gate → checkout funnel
(payments flag-off); branded landing + marketing pages. **Free for all
logged-in users** (per-QR paywall removed).

---

## What shipped today (2026-06-02) — 3 batches

1. **UI batch** (`d7f1a30`): animated iOS-style **Active/Inactive toggle**
   (sliding switch + colour fade); **Save changes moved under the QR
   preview** on the edit page; **"+N today" KPI badge** (rolling 24h) on
   Total Scans + Unique Scanners.
2. **Perf batch** (`dffcedf`):
   - **#53 Step-3 freeze FIXED** — the 300 ms debounce gated nothing
     (`JSON.parse(debounced)` + the inline `QrPreview` style object were
     rebuilt every render, so qr-code-styling `.update()` fired on every
     keystroke / colour-drag). Memoised the parsed style + preview-style on
     the debounced snapshot → live QR re-renders **≤ once per ~300 ms
     idle**. Also memoised the 16-frame grid + 12 logo presets + stabilised
     `set` (functional update).
   - **#2 blank thumbnails FIXED** — `styled-qr` defers qr-code-styling
     generation to `requestIdleCallback` so the cached `render.png` `<img>`
     paints first; `render.png` active-QR cache gained
     `stale-while-revalidate=604800` for instant repeat list loads.
3. **Lock / KPI batch** (`2208e21`):
   - **Inactive-lock** — a suspended QR's row is fully inert (thumbnail,
     name, destination, analytics pill, download all non-interactive;
     row-menu Edit/Analytics disabled). Only the **toggle** (reactivate) +
     **Delete** stay live. Reactivating restores everything.
   - **Active-QR KPI card** now shows an **active + inactive split**
     (`● N active · ● M inactive`) under the `N / total` headline.
4. **Data cleanup** — deleted the 2 agent test QRs (`gb2TavW` 20 scans,
   `z7qBcbu` 1 scan) via the app's DELETE endpoint → 0 rows / 0 orphan
   scans; account analytics clean.

> ⚠️ Deploy verification of batches 2 + 3 was still in flight at handoff
> (Vercel was running slow, ~5–8 min). To confirm live: GET
> `…/render.png?size=<fresh>` must return `stale-while-revalidate`, then
> drive the inactive-lock (toggle a QR off → its links are dead) + the KPI
> card on prod via Chrome MCP.

---

## Project facts you MUST know (gotchas)

- **CWD trap (got worse):** the shell cwd can silently reset to the OUTER
  worktree (`workspace@0.0.0`, pnpm-based) — a bare `npm run build` then
  builds the wrong project and dies on `pnpm`. **Always**
  `cd /c/Users/masim/Downloads/masaar && npm run build`, and use **`git -C
  /c/Users/masim/Downloads/masaar …`** for every git command. Grep/Glob
  default elsewhere too — pass `path=C:\Users\masim\Downloads\masaar\src`.
- **Repo is PUBLIC** (`killed.../masaar`). Keep strategy / audit / sprint
  docs **LOCAL / untracked** (`SPRINT2.md`, `SPRINT2_INDEX.md`,
  `STRATEGY.md`, `SECURITY_AUDIT*`, `SPRINT2_SESSION_*_PROMPT.md`).
  `NEXT_SESSION.md` + `BACKLOG.md` are tracked — committing the latest doc
  edits is **awaiting Usama's OK**.
- **Supabase** ref `hsnrupadmygkeirhujiv`, region **`ap-south-1` (Mumbai)**.
  Migrations: present SQL → **Usama approves inline** → apply via Supabase
  MCP `apply_migration` → record `.sql` in `supabase/migrations/`. Enum
  `ADD VALUE` must be its own migration.
- **Service-role key is server-only** (`createAdminClient()`,
  `@/lib/supabase/admin`) — only used inside `unstable_cache` (`getMe`,
  `getAccountAnalyticsCached`).
- **Vercel MCP is FORBIDDEN** (403, token scoped to another team). Deploy =
  push `main` → Vercel auto-deploys. Verify via **curl marker (GET) +
  Chrome MCP**, never the Vercel MCP. Marker = `render.png` `cache-control`
  — must be a **GET** (route is GET-only; a HEAD returns no usable header).
  Use a fresh `?size=` to dodge edge cache. Deploys ran **slow** today.
- **Deletes are gated** (need Usama's explicit OK). When granted, prefer the
  app's own DELETE endpoint (page-context fetch via Chrome) over raw SQL.
- **Chrome MCP browser** = Usama's machine in Medina, SA (logged in as
  Usama) — great for real-geo latency + driving the real prod flow.
- `after` from `next/server` is stable on edge (scan logging). Don't "fix"
  the dependency pins. **Never `npm run build` while `npm run dev` runs.**

## Collaboration workflow (Usama's preferences)

- **Exact ordering, one-commit-per-fix.** Branch off `main`, build after
  each fix, commit, `git merge --no-ff` → main + push, co-author trailer.
- **Gate + paste**, **STOP-and-ask on any scope / behaviour conflict.**
- After deploy: **verify on prod via Chrome MCP** + curl markers; be honest
  about what could / couldn't be verified.

---

## Open / remaining polish (small — everything else is shipped)

1. **getMe transient blip** — once showed "Free Plan · 0/5" (admin-client
   hiccup cached 60 s; self-corrected). Robustness: don't cache a failed
   fetch — return uncached on error in `src/lib/me.ts`.
2. **CSV / Excel scan export on the edit page** — offered, not yet wired;
   the per-QR route already exists (`/api/qr/[id]/scans.csv`), just surface
   the button.
3. **Manual (Usama only):** enable Supabase Auth → **Leaked Password
   Protection** toggle in the dashboard.

*(Done & removed: #53 Step-3 INP freeze, #2 blank thumbnails, the 2
test-QR deletions, the optional scan edge-cache — render.png SWR + the
existing Mumbai pin cover it.)*

---

## Forward plan — REORDERED 2026-06-02 (Arabic is now LAST)

**Usama's call:** Arabic & RTL becomes the **FINAL end-to-end pass**, once
the whole website is built. New order:

1. **(Optional, quick) Close the 3 polish loose ends above.**
2. **Phase 2 — Masaar Menu vertical** (the big value; directly powers
   Karak Express's digital menu):
   - **Session F** — Menu schema + **AI menu import** + builder wizard
     (`SPRINT2_SESSION_F_PROMPT.md`)
   - **Session G** — Menu mobile renderer `/m/[shortId]`
     (`SPRINT2_SESSION_G_PROMPT.md`)
   - **Session H** — Menu analytics + marketing + pricing
     (`SPRINT2_SESSION_H_PROMPT.md`)
3. **Sprint 3 — pick ONE** (don't bundle): **smart routing** (same QR →
   different destination by geo / time / language — the Karak city-routing
   idea), WhatsApp Business deep integration, **Mada / Tap payments** wiring
   (flip `PAYMENTS_ENABLED`), table-side ordering, print fulfillment.
4. **Client deliverable (parallel, in Lovable):** Karak Express **central
   hub QR** → `karakexpress.com/tap` link-hub (Website · Socials ·
   Locations · Menu · WhatsApp · AI agent · Reviews), plus the **2-QR
   per-city menu** setup. Masaar provides the dynamic QR(s) + scan
   analytics; the hub page itself lives on karakexpress.com.
5. **FINAL — Session E (Arabic & RTL):** `next-intl` + `dir="rtl"`,
   site-wide localization as the **last** step + a full bilingual
   end-to-end smoke test (Plex Arabic font already wired).
   (`SPRINT2_SESSION_E_PROMPT.md`.)

> Kickoff for a sprint session: _"Read `SPRINT2_SESSION_<X>_PROMPT.md` and
> execute the full session. Read `CLAUDE.md`, `SPRINT2.md`, `STRATEGY.md`,
> `BACKLOG.md`, and this file first."_
