# Sprint 2 — Session A Report: Funnel & Foundation

Branch `sprint-2/session-a-funnel` → merged to `main`.
26 commits off `main@306a2b0`. Every commit gated on `tsc --noEmit` +
`next build` (green).

---

## Commits shipped

### Part 1 — funnel core
- `54ea451` feat(db): migration 004 — qr status machine + anon-draft + sub scaffold
- `85f5295` feat(redirect): status-branch /r/[shortId] via resolve_qr_v2
- `9ea8f8a` feat(lockin): hosted /activate + /expired server pages
- `e2d4c61` feat(create): public anonymous QR builder at /create
- `136c5f2` feat(anon): /api/qr/anonymous + create_anon_qr RPC + per-IP rate limit
- `228edb4` feat(claim): email-gate modal + /auth/claim magic-link conversion
- `17b6a4e` feat(checkout): /checkout/[shortId] stub + PAYMENTS_ENABLED + activate
- `297800b` fix(db): migration 007 — revoke anon EXECUTE on claim_draft_qrs

### Part-1 review bugs
- `9323a63` fix(redirect): bug1 — lock-in unbypassable (cache + fail-closed + legacy resolver) [migration 008]
- `6ac2b4e` fix(db): bug2 — create_anon_qr short_id collision retry [migration 009]
- `be9edb2` fix(dashboard): point New QR CTA to /create (UX gap 1)
- `b405b43` feat(edit): editable design fields + expanded PATCH allowlist (UX gap 2)

### Part-2 review bugs
- `47c0d79` fix(builder): bug3 — auto-prepend https:// for bare-domain URLs
- `6a12199` fix(create): bug4 — authed users skip the email gate
- `a2b57e0` fix(email-gate): bug5 — clarify existing-account flow
- `0e77305` fix(dashboard): make New QR CTA more prominent

### Part 2 — content types, logo, nav
- `057755c` fix(builder): audit — unhide non-URL content types + complete vCard
- `3ab1e09` feat(content): WhatsApp content type (§8)
- `39c11d0` feat(content): App Link content type (§9)
- `a2c8544` feat(builder): logo upload (authed) embedded in QR center (§7)
- `60890f3` feat(marketing): nav stub pages + wire landing links & funnel CTA (§10)

### Part-3 review bugs + polish
- `50de3f0` fix(qr): bug6 — render saved logo_url in the QR preview
- `d7c5220` fix(env): bug7 — resolvable appUrl() instead of preview.invalid
- `5c984d9` fix(builder): bug8 — debounce QR preview re-render 300ms
- `570ce4d` fix(funnel): bug9 — active subscribers skip checkout (SaaS model)
- `a5e4204` feat(ux): save/create toasts + post-action redirects (sonner)

### Migrations (all applied + verified on live `hsnrupadmygkeirhujiv`, user-gated)
004 status/draft_token/sub scaffold · 005 create_anon_qr + rate limit ·
006 claim_draft_qrs · 007 revoke anon on claim · 008 resolve_qr
status-gated · 009 create_anon_qr collision retry. All additive (no
drops); ledger 004–009 recorded.

---

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Anonymous → email → magic link → checkout → dashboard | ✅ user smoke-confirmed |
| 2 | Lock-in: pending scan → /activate, scan still logged | ✅ user re-smoke-confirmed (Bug 1 + migr. 008) |
| 3 | Logo embeds in QR | ✅ authed only (anon deferred); render fixed (Bug 6) |
| 4 | All 7 existing content types usable in UI | ✅ gating fixed + vCard completed (2a) — phone-scan = Usama |
| 5 | WhatsApp content type | ✅ code-complete — phone-scan = Usama |
| 6 | App Link content type | ✅ code-complete — phone-scan = Usama |
| 7 | Every header + footer link resolves, no #/404 | ✅ (2e/2f) |
| 8 | Existing QRs/dashboard/analytics not broken | ✅ resolve_qr_v2 + 008 keep active QRs working |
| 9 | `npm run build` green | ✅ every commit |
| 10 | Migrations additive/reversible-ish | ✅ add-only, 004–009 |
| 11 | Self-audit written | ✅ (below) |

---

## Deferred / not in scope (logged forward)

- **Anonymous logo upload** — `logos` bucket policy requires
  `auth.uid()=foldername[1]`; anon can't upload without a new storage
  policy (unapproved live change + security footgun). Scoped to authed
  users; anon adds a logo after claiming. → BACKLOG.
- **SMS encoder format** — kept the existing `SMSTO:`/`sms:` (more
  scanner-compatible) instead of the spec's literal `sms:?body=`;
  flagged as a decision, not silently changed (can't phone-test).
- **Checkout page + email-gate visual polish** — deferred to Session B
  (mockup-driven pass), per Usama.
- **App Link per-platform store routing** — Sprint 3 (spec §9).
- **Builder relocation to `components/qr-builder/`** — kept the
  existing `qr-customizer.tsx` path; Sessions B–H depend on it,
  relocating adds blast radius for no functional gain.
- Out-of-scope per spec: Stripe wiring, PDF/Image/Video/Location/Menu
  types, Arabic/RTL, bot filtering, domain purchase, prod test-data
  cleanup.

---

## Self-audit (honest — where the next bugs may hide)

- **Real-phone scan tests not performed by me** — vCard / WiFi / SMS /
  Email / Phone / WhatsApp / App Link encoders are implemented per
  spec but acceptance "scan on a real phone" (§7b/§8/§9) is **Usama's
  to verify**. SMS uses `SMSTO:` (see deferred).
- **Protected-preview HTTP limits** — the branch preview is Vercel
  Deployment-Protected (401 to anon) and screenshot tooling times out
  here, so Bugs 6–9 click-paths and the funnel were verified by code +
  DB inspection + Usama's smoke rounds, not by me driving the browser.
- **`appUrl()` browser fallback** — on preview the client builder uses
  `window.location.origin` (server-only `VERCEL_URL` isn't inlined).
  Correct, but means the encoded short link == whatever origin the
  builder was opened on; fine for preview/prod, worth knowing.
- **PKCE claim cross-device** — magic-link `/auth/claim` needs the
  verifier cookie from the same browser; cross-device link opens fail
  the exchange (acceptable v1).
- **`create_anon_qr` retry** treats any `unique_violation` as a
  short_id collision (the only unique constraint on the insert) and
  regenerates with `random()` (fine for a retry; first attempt keeps
  the client's nanoid id so preview == saved).
- **Bug 9 ordering** — `/api/checkout/activate` flips
  `profiles.subscription_status='active'` best-effort (no error
  surface); if that write ever fails, the next QR would still be
  pending. Low risk (owner RLS verified) but not hardened.

---

## Time spent

Not instrumented (no reliable wall-clock in this environment). Scope
delivered: full funnel core, 6 gated migrations, Part 2 (content
types/logo/nav), and 9 review-bug fixes + toast polish across
**four** Usama review/smoke cycles.

---

## Open questions for Usama

1. SMS: keep robust `SMSTO:` or switch to the spec's literal
   `sms:?body=` (less reliable on iOS)?
2. Anon logo upload — want a reviewed storage-policy migration in
   Session A.5/B, or leave logo as an authed-only feature?
3. Dashboard "new row highlight" — `?welcome_new_qr=1` is wired into
   the redirect; the dashboard highlight UI itself is not built (left
   for the visual pass). Confirm that's Session B.
4. Production `NEXT_PUBLIC_APP_URL` — confirm the Production-scope
   value is the real domain (appUrl falls back to canonical
   `masaar-zeta.vercel.app` if it's missing/contains "invalid").
