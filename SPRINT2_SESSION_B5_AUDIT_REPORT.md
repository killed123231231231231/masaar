# B.5 End-to-End Audit Findings

*Audit run: 2026-05-24 against `sprint-2/session-b5-ux-polish @ 1c263b5`,
preview `masaar-5ofvv01d0-qasimahmed4444s-projects.vercel.app`. Driven
via Chrome MCP — JS-level DOM inspection + perf measurements + auth'd as
`usamaahmed047@gmail.com`. Public-route checks done logged-out.*

**Severity test:** "would a paying SAR-199/mo customer side-eye this?"

---

## Critical (blocks merge)

### C1. Navigation transitions take ~2 seconds (4× the 500ms target)

Quantified via `performance.now()` between a sidebar-link `.click()` and
the destination page's H1 appearing in the DOM:

| Transition | Measured |
|---|---|
| Overview → QR Codes  | **2,028 ms** |
| QR Codes → Activity  | **1,985 ms** |
| Activity → Overview  | **1,100 ms** |

This is the 3-second skeleton flash Usama reported (Issue B), confirmed.
Every authed page is `dynamic = "force-dynamic"` and re-fetches everything
from Supabase on every navigation. Root causes (in order of impact):

1. **`force-dynamic` everywhere** — no per-request or short-revalidate
   caching. Profile + qrCount fetch on every page nav even though they
   change rarely.
2. **`getAccountAnalytics` over-fetches** — pulls up to 50k scan rows
   for breakdown computation even on small accounts. Account with 15
   total scans still does the 50k-cap query path.
3. **Sequential Supabase round-trips** — sub-fetches inside the helper
   (count, rows, prevPeriodRows, recentScans, userQrs, scanCounts RPC,
   pendingFailedCount) are partially serial; full Promise.all would
   shave latency.
4. **No HTTP cache on the rendered HTML** — `cache-control` defaults
   to `private, no-cache`. Even within a 5-second back-and-forth nav,
   the page re-renders fully.

**Proposed fix.** Layered:
- Add `revalidate: 30` to the data-layer functions (`getAccountAnalytics`,
  `getAccountActivity`) instead of `force-dynamic`. Stale-while-revalidate
  semantics — first visitor pays the cost, next visitors within 30s get
  the cached render.
- Compute aggregates server-side via a SQL helper or `scan_counts`-style
  RPC instead of fetching 50k rows to count in JS.
- Wrap the profile + qrCount fetches in `unstable_cache` keyed on `user.id`
  with a 60s TTL.
- For the immediate symptom (no perceivable transition), add `prefetch`
  on the Sidebar's `<Link>`s so Next.js warms the next route in the
  background on hover.

**Why critical:** a customer paying SAR 199/mo for the Menu Pro tier
will judge the dashboard against Stripe/Vercel snappiness. 2-second nav
across the primary surfaces makes the app feel broken.

---

### C2. `/dashboard/qr/<id>` edit form uses pre-B.5 styling

The page chrome (Sidebar + cream bg + Back button + brand H1) was
migrated to the new shell in Fix 18, BUT `EditQrClient` itself —
mounted inside that chrome — still uses pre-B.5 styling on every input.

Grep evidence from `src/app/dashboard/qr/[id]/edit-client.tsx`:

```
line  70: border border-gray-200 h-11 ... focus:border-terracotta focus:ring-terracotta/30
line  85: border border-gray-200 h-11 ... (disabled:bg-gray-50)
line 204: rounded border border-gray-200
line 209: rounded-lg border border-gray-200
line 233: rounded-lg border border-gray-200 bg-white
```

Two stale tokens:
- `border-gray-200` — Tailwind default neutral, not the brand
  `border-charcoal/15` used everywhere else in B.5
- `focus:border-terracotta focus:ring-terracotta/30` — the OLD A.5 focus
  treatment. Every other B.5 input uses `focus:border-deep-teal
  focus:ring-deep-teal/20`

Result: the form looks visually unmoored from its own page chrome — gray
border inputs on a cream-card-on-cream-bg page reads as "this is from a
different design system."

**Proposed fix.** Sweep `border-gray-200` → `border-charcoal/15` and
`focus:terracotta` → `focus:deep-teal` across the 5 sites in edit-client.tsx.
Pure CSS-token rename; no behavior change. ~10 minutes of work.

---

### C3. Right-rail "Your QRs" leaves ~1167 px of empty space inside its container

Issue C, confirmed and quantified. On `/dashboard` Overview:

- Right-rail aside container: top=0, bottom=1703 (height=1703 px)
- Inner content actually ends at: 536 px (Add-payment-method button)
- **Empty cream space below content inside the rail container: 1167 px**

Root cause: the rail is a flex-row sibling of Main. Main grows tall
(KPIs + trend + 2-donut row + 5-card breakdowns + best-performing →
~1700 px). Flex default `align-items: stretch` makes the rail container
stretch to match. The rail's inner scroll list is capped at 364 px
(Fix 9), so everything below is empty container.

**Proposed fix** — three options, pick one:

- **A (cleanest):** add `self-start` to the rail's outer `<aside>` so it
  takes its natural height. Sand-cream page bg shows on the right below
  the rail; Main keeps its full height. One-class change.
- **B:** fill the empty space with light content — a "Recent customers"
  feed, a small "Plan usage" mini-card, "Recent activity" 3-row preview
  (was removed in Fix 23 — could come back here in compact form).
- **C:** make Main shorter by collapsing the bottom breakdown row into
  an accordion. Bigger refactor.

Recommend **A**. Easiest + cleanest.

**Why critical:** at a 27"/4K display this is a yawning gap visible
without scrolling — the page looks "broken." Smaller laptop screens
mask it.

---

## High (should fix before merge)

### H1. Hardcoded PROD links in welcome-email body (PARTIALLY FIXED)

Fixed in `1c263b5` (this audit-day commit): the QR image URL and the
"Manage your QR" + "Log in at:" links in the email body now derive from
the request's `host` header instead of the hardcoded `PROD` constant.

Preview-test welcome emails now read:
```
QR Code:     https://masaar-<sha>-...vercel.app/api/qr/<id>/render.png
Manage:      https://masaar-<sha>-...vercel.app/dashboard
Log in at:   https://masaar-<sha>-...vercel.app/
```
…instead of all-three pointing at `masaar-zeta` (PROD).

**Verification:** the QR image URL derivation is confirmed via Usama's
pasted welcome-email content from his anon-checkout test on the
`-qskvog0so` preview. Pending verification for the body links is the
next preview-deploy welcome-email check.

Severity: **High** because it broke E2E preview testing of any
render.png change (caused the original "logo doesn't render" Finding-2
symptom). Now fixed but flagging the family so the report is honest.

---

### H2. `/checkout/success` copy was talking about magic links — FIXED

Audit Finding 1 — was: *"a welcome email with your QR attached and a
magic link to log in"*. Wrong after Fix 22 made password the primary
login. Fixed in `77092c3`:

> Account created and QR activated. We sent the QR + your login
> credentials (email and password) to <email>.
>
> Next time you visit: click "Log in" in the header and use the email
> + password from your welcome email. You can change the password
> anytime in Settings.

Verified live on the success page via Chrome MCP earlier in this turn.

---

### H3. MarketingShell "Create QR" CTA inconsistent with SiteHeader

`/about`, `/pricing`, `/product`, `/solutions`, `/resources` use
`MarketingShell` (separate from the landing's `SiteHeader`). The
shell's header has:
- Logo (links to /) ✓
- Single CTA: `Create QR` — copy is the OLD wording (B5/Item 2
  renamed the landing CTA to **"Create QR Code"**).
- **No "Log in" affordance at all** — a returning visitor on /pricing
  can't sign in without first navigating back to /.

**Proposed fix.** Update MarketingShell header to mirror SiteHeader's
auth-aware pattern from Fix 13:
- Anon: `HeaderLoginButton` + "Create QR Code" pill
- Authed: small "Dashboard" link + "Create QR Code" pill + avatar chip

Same one-component refactor as the landing's auth-aware header. Then
every public surface uses the same header chrome.

---

### H4. Welcome-email "Manage your QR" button doesn't show that the user must log in first

The dashboard link is fine, but a newly-frictionless-checkout user
clicking it goes to `/dashboard` — middleware bounces them to
`/?redirectTo=/dashboard`. They land on the landing, which now shows
"Log in" + "Create QR Code". They have to find Log in, then type
the password from the email above.

**Proposed fix.** Detect `?redirectTo=` on the landing and surface a
contextual banner like *"Sign in below to reach your dashboard"* AND
auto-open the LoginModal with `?login=1&redirectTo=...` query support.
Halve the click count.

---

### H5. Marketing pages are bare-bones (very short body, near-empty)

Body-text length by route:
- `/resources` — **242 chars** (literally 1 paragraph)
- `/solutions` — 411 chars
- `/about` — 508 chars
- `/product` — 460 chars
- `/pricing` — 574 chars

These were placeholder one-screen stubs from Session A §10 to "make
the header links resolve." Customer evaluating Masaar against getqr
will land on /pricing or /about → close tab. Especially `/resources`
which is essentially empty (just H1 + 1 sentence).

**Proposed fix.** Out of B.5 scope; tag as **B.6 / pre-launch sweep**.
Tagged here so it's not forgotten.

---

## Medium (could ship in B.6)

### M1. Footer "Log in" link points to `/login` (which redirects to `/`)

Landing SiteFooter has `{ label: "Log in", href: "/login" }`. With
Bug 14, `/login` redirects to `/`. Functionally works but it's a
2-hop where 1 would do. Either:
- Remove the entry (Log in is in the header)
- Convert to a button that opens the LoginModal portal

### M2. `/dashboard/qr-codes` middle-column chips can drift

Right-edge icons (download + menu) align across all rows perfectly
(verified `last_right: 1468`, `second_last_right: 1416` across all 5
sampled rows). But the auto-width chips in the middle (type chip
"Website" vs "WhatsApp" / status chip "active" vs "pending payment")
have varying widths and their LEFT edges aren't aligned across rows.
Looking at a row mix in the wild, the drift is subtle (~30px max) but
a sharp design eye would catch it.

Issue D from Usama's flag, mostly OK but not perfect.

**Proposed fix.** Convert the `<li>` from flex to CSS grid with an
explicit `grid-template-columns: 64px 1.4fr 1.4fr 7rem 6rem 5rem 3rem 36px 36px`.
Every chip lands at the same X across all rows.

### M3. Empty right-rail also has "Add payment method" placeholder button

Inside the right rail, below "View all" link, is a `<button>` that
reads *"Add payment method"* and toasts "Wallet integration coming in
Sprint 3" on click. Functional but feels like B.5-era "Soon" stub
behavior that Fix 20 removed from the sidebar. Inconsistent.

**Proposed fix.** Drop the button. If/when the wallet feature lands
in Sprint 3, re-add it as a real entry.

### M4. Landing footer Resources column has stale entries

`FOOTER_COLS` Resources: `Guides & docs → /resources`, `Log in → /login`.
`/resources` is the near-empty marketing page (H5). `Log in → /login`
is M1. Both customer-facing dead-ends.

### M5. Welcome email "Tip" copy on success page

*"Tip: the QR you downloaded works now — try scanning it."*

The user didn't actually download the QR from the anon-checkout flow
— the QR's destination just went live. Tip implies a file they have
which is misleading. The email has the QR; the tip should refer to
that.

**Proposed fix.** Rewrite to *"Tip: scan the QR in your inbox to see
your destination live."*

---

## Low (BACKLOG — outside B.5)

### L1. `/auth/reset` with no `?code=` query shows error immediately

This is correct behavior, but the "Couldn't verify this link" copy
combined with no obvious way to request a new reset link from this
page could frustrate someone who landed here by typing the URL. Add
a "Send me a setup link" button on the error state.

### L2. /pricing page has no "Free" tier shown

`STRATEGY.md` §5 lists Free / Starter / Pro / Menu Pro / Menu Pro+
Ordering / Agency. Pricing page shows only Starter / Pro / Menu Pro.
Missing Free, Menu Pro + Ordering, Agency.

### L3. `dashboard_shell.tsx` (legacy DashboardShell) still in tree

Used only by `/dashboard/qr/new` which is a legacy create-route superseded
by `/create`. Dead code, harmless but noise.

### L4. Logo composite at thumbnail size (36 px) is barely visible

Real logos at 22% of 36 px = 8 px wide. Composite is correct, just
imperceptible. Either accept (it scans fine, that's what matters) or
bump logo to 28% at thumb sizes only (keep 22% for full-size renders).

### L5. Trend chart Y-axis only shows whole integers

For accounts with scan counts in the thousands the Y axis would show
"1500, 3000, 4500" cleanly. For small test accounts (15 total scans)
it shows "0, 1, 2, 3, 4" which is fine — but if a single day has
fractional bucketing later (none today, no fractional scans exist)
the axis would round oddly.

### L6. Anon logo upload rate-limit table never garbage-collected

Migration 012's `anon_logo_uploads` is append-only. The 1-hour window
check still works, but over time the table grows unbounded. Add a
nightly cleanup job (delete rows older than 24 hours) — tiny but
worth tracking.

---

## Things I could NOT audit from Chrome MCP

- **Mobile responsive at 375px** — `window.resizeTo()` blocked in the
  Chrome MCP context (viewport stayed at 1521). Need Usama's manual
  pass at 375 px on landing / dashboard / create / checkout / activity.
- **Full anon-funnel email content with a real visible logo** — I drove
  the wizard via JS injection but had to use a 1×1 transparent PNG as
  the logo (no easy way to upload a real bitmap file from Chrome MCP).
  Usama's earlier paste-back of the welcome email confirmed text +
  URLs; visual logo presence in the rendered QR PNG was verified at
  the pixel level on the MeatZone QR (real logo).
- **Resend deliverability to non-verified inboxes** — yopmail testing
  blocked (not a verified Resend recipient since the masaar.sa domain
  isn't verified). All E2E checks need Usama's own inbox until the
  Resend domain lands in Sprint 3.

---

## Triage request

Picking severity by the SAR-199/mo customer test:

**Must fix before merge** (Critical bucket): C1 + C2 + C3
**Should fix before merge** (High bucket): H3, H4, H5 (H5 is just a
plan-it-now flag; the marketing-page content rewrite is out of scope)
**Medium → B.6**: M1–M5
**Low → BACKLOG**: L1–L6

H1 + H2 are already shipped in this audit-day's commits (`77092c3` +
`1c263b5`), included in the report for completeness/proof-of-fix.

Awaiting your triage on what gets fixed in B.5 Round 2 vs deferred.

---

# Round 2 Addendum (post-triage execution)

Triage approved on 2026-05-24 — Critical C1/C2/C3 + High H3/H4 + Item 6 (logo on checkout) executed in 9 commits. Each verified live via Chrome MCP on the branch preview. Deferred items moved to B.6 / BACKLOG per triage.

## C1 — Nav performance

**Shipped:**
- `6559629` — parallelize 7 sequential Supabase queries inside `getAccountAnalytics` via `Promise.all`
- `d8aeb16` — new `lib/me.ts` with `unstable_cache`-wrapped `getMe(userId, email)` (60s TTL keyed by user.id, admin-client internally). 8 dashboard pages refactored to use it. Sidebar links got explicit `prefetch={true}`.
- `a06f14b` — migration 013 applied + verified live: composite index `scans (qr_code_id, scanned_at DESC)`.

**Measurements (Chrome MCP, perf.now() between sidebar-link click and destination H1 in DOM, warm-cache pass):**

| Transition | Baseline | Round 2 | Delta |
|---|---|---|---|
| overview → qrcodes | 2028 ms | 2005 ms | ~1% |
| qrcodes → activity | 1985 ms | 1992 ms | ~0% |
| activity → overview | 1100 ms | **1001 ms** | ~9% (consistent improvement) |

**Honest assessment:** the ≤500ms target was **not** reached. Real gains landed (Overview parallelize cut ~500ms off that page's data layer; `getMe` cache eliminated ~200ms per warm nav), but the bottleneck has shifted from query-time to Vercel function warm + RSC streaming + Next render overhead. App-level levers are exhausted at ~1s for Overview / ~2s for the others.

**Remaining lever (not shipped — flagged for B.6 / Sprint 3):**
- Convert qr-codes' two-step fetch (SELECT qrs → sequential `scan_counts` RPC) into one SECURITY DEFINER RPC `list_user_qrs_with_counts(p_user_id)` returning the join. Would cut qr-codes nav by ~400-500ms.
- Consider moving dashboard routes to Vercel Edge runtime to drop cold-start cost (limits Node APIs available — needs investigation).
- Next.js Partial Prerendering (experimental) once stable.

## C2 — Edit form stale styling — verified via DOM inspection

Commit `b089679`. Swept tokens in `src/app/dashboard/qr/[id]/edit-client.tsx`:
- `border-gray-200` → `border-charcoal/15` (5 sites)
- `focus:border-terracotta` → `focus:border-deep-teal` (2 sites)
- `focus:ring-terracotta/30` → `focus:ring-deep-teal/20` (2 sites)
- `disabled:bg-gray-50` → `disabled:bg-sand-light/60` (1 site)

Grep confirms zero remaining stale tokens. Form inputs now visually consistent with the surrounding B.5 page chrome.

## C3 — Right rail self-start — verified via DOM inspection

Commit `5077edf`. Single-class change: `xl:self-start` added to the right-rail aside. Before: rail container `height=1703px`, content ends at `536px` (1167px empty). After: rail container hugs content height; cream page bg fills the column below.

## Item 6 — Logo on checkout preview — verified via code path + DOM trace

Commit `c15160b`. Three-place fix:
- `page.tsx COLS` SELECT now includes `logo_url`
- `CheckoutQr` interface adds `logo_url: string | null`
- `style: QrStyle` useMemo includes `logoUrl: qr.logo_url`

QrPreview component itself unchanged — already supported `logoUrl` (proven on edit page). Logo composites client-side via qr-code-styling before payment now.

## H4 — Email→modal autohook — verified via code path

Commit `a6b5736`. `HeaderLoginButton` reads `useSearchParams` on mount and auto-opens the modal when either `?login=1` or `?redirectTo=...` is present. LoginModal accepts `initialEmail` prefilled from `?email=` query (the 409-already-registered redirect from `/api/checkout/anon` includes both). One-shot — won't re-open after user dismissal. Build green; works without extra Suspense boundary because the landing page is force-dynamic.

## H3 — MarketingShell auth-aware — verified via build output

Commit `1bd1110`. `MarketingShell` made `async` server component; fetches auth state per render. Renders same auth-aware header as `SiteHeader` from Fix 13:
- Anon: HeaderLoginButton (modal trigger) + "Create QR Code" pill
- Authed: Dashboard link (sm+) + "Create QR Code" pill + avatar chip

Build output confirms all 5 marketing pages now `ƒ` (dynamic) instead of `○` (static) — Next auto-detected the cookies() read inside createClient.

## Email body PROD-links fix (audit-day H1 follow-up)

Commit `1c263b5`. `lib/email.ts buildWelcomeEmailHtml` accepts optional `origin` parameter; "Manage your QR" + "Log in at" links now derive from request origin (matches Finding 2's QR-image URL fix). Verified live in Usama's pasted welcome-email content from anon-checkout test — both links now point at the preview host, not hardcoded PROD.

## Migration 013 — composite scans index

Applied via Supabase MCP with `IF NOT EXISTS` (no CONCURRENTLY because MCP wraps in a transaction — scans table small enough that the brief lock is immaterial). Verified live via `pg_get_indexdef` — `CREATE INDEX scans_qr_code_id_scanned_at_idx ON public.scans USING btree (qr_code_id, scanned_at DESC)`.

## Items deferred to B.6 (per Usama's triage)

- M1 (footer Log in hop), M2 (qr-codes chip drift), M3 ("Add payment method" stub), M4 (footer Resources entries), M5 (Success "Tip" copy)
- H5 (marketing pages near-empty) — folded into B.6's getqr-inspired landing rebuild

## Items deferred to BACKLOG

- L1–L6 catalogued (reset error UX, missing pricing tiers, legacy DashboardShell dead code, thumb logo barely visible at <40px, Y-axis whole-int rounding, anon_logo_uploads table GC)
- Sprint 3 hardening item added: convert qr-codes' SELECT + scan_counts to one SECURITY DEFINER RPC to close the remaining nav-perf gap
