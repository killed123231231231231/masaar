# Sprint 2 — Session A.7 Report: Frictionless Checkout (email-holding)

Branch `sprint-2/session-a7-frictionless-checkout` off `main@01938f1`.
**Not merged** — paused for Usama's browser smoke. Every commit
`tsc`+`build` green.

Preview: `https://masaar-git-sprint-2-session-a7-frictionless-checkout-qasimahmed4444s-projects.vercel.app`

## Commits shipped

- `a476c6e` migration 010 — `qr_codes.creator_email` + partial index (applied + verified live)
- `385e358` `GET /api/qr/[id]/render.png` (qrcode, server-side) + `lib/supabase/admin.ts` service-role client
- `c2f4ad3` `lib/email.ts` — Resend-via-fetch, stub-safe (no key → build HTML + log, no fake send)
- `eff2a9a` `POST /api/checkout/anon` — validate / idempotent / ~5-IP/hr / dup-email 409 / admin.createUser / claim+activate / profile sub / welcome email
- `f46a277` email-gate refactor — new users → checkout (no magic link); + `PATCH /api/qr/anonymous/email`; LoginModal path unchanged
- `3ac2740` §6 — `/checkout/[shortId]` relaxed for anon (draft_token+email), Pay → `/api/checkout/anon`, 409 inline
- `eba3955` §8 — CLAUDE.md Funnel section + BACKLOG §5 follow-ups
- (this) session report

## Acceptance criteria

| # | Status |
|---|--------|
| 1 migration 010 applied, additive | ✅ live: `creator_email text` + partial index `qr_codes_creator_email_idx`, recorded `20260518163649`, 25 cols (no drops) |
| 2 `/api/checkout/anon` full logic | ✅ code-complete (validate/idempotent/rate-limit/createUser/claim/profile/email) |
| 3 email-already-exists → 409 + login_url, no merge | ✅ via `admin.listUsers` + createUser dup safety-net |
| 4 email gate no magic link for new users | ✅ store→PATCH creator_email→`/checkout?draft_token&email` |
| 5 anon checkout page loads for unauthed w/ valid params | ✅ admin lookup of draft row, email-match defense |
| 6 welcome email (or clean stub) | ✅ **stubbed** (no Resend key) — HTML built per §4 + console-logged |
| 7 server PNG `/api/qr/[id]/render.png` | ✅ qrcode, configured colors, used in email `<img>` |
| 8 magic-link preserved for "Log in" | ✅ LoginModal unchanged (verified `signInWithOtp`/Google-stub/switch-back) |
| 9 authed subscriber path unchanged | ✅ A.5 path untouched |
| 10 lock-in still works | ✅ unchanged — QR stays `pending_payment` until `/api/checkout/anon` flips it; scan → `/activate` |
| 11 `npm run build` green | ✅ every commit |
| 12 self-audit | ✅ below |

## Test results (honest)

I **cannot drive the browser** on the Deployment-Protected preview
(401 to anon; no console access) — the consistent harness limit.
Verified at code + DB level; **browser Tests A–D are Usama's**:

- **Test A (new user):** `usamaahmed047+a7test@gmail.com` confirmed
  NOT in `auth.users` → `createUser` will succeed → claim/activate →
  welcome email **stubbed (logged)**. Path code-verified.
- **Test B (existing user / Log in):** LoginModal `signInWithOtp`
  intact — needs the new preview URL in Supabase Redirect URLs
  (Usama adding in parallel; not blocking other work).
- **Test C (email exists):** `usamaahmed047@gmail.com` confirmed
  present in `auth.users` (1) → `/api/checkout/anon` returns **409
  email_already_registered** + `login_url`; checkout-client shows the
  inline message + "Log in" link. Logic verified end-to-end.
- **Test D (lock-in):** unchanged Session-A mechanic — anon QR is
  `status='pending_payment'` until `/api/checkout/anon` sets
  `'active'`; `/r/[shortId]` fail-closed → `/activate`. Verified by
  reasoning (no code in that path changed).

Service-role redeploy on the branch preview is **● Ready** — the
admin-dependent routes (anon checkout, render.png, anon-email PATCH)
are operational on preview (Usama added `SUPABASE_SERVICE_ROLE_KEY`
to Preview scope across branches; temporary sprint scoping — Sprint-3
rotation logged to BACKLOG §5).

## Welcome email delivery method

**Stubbed.** No Resend account/key (can't self-provision). `lib/email.ts`
builds the exact spec §4 HTML and `console.log`s a stub line; sends
for real only when `RESEND_API_KEY` starts with `re_`. `RESEND_API_KEY`
intentionally unset. Honest stub over fake-send (spec §4).

## Skipped / BACKLOG (logged §5)

Post-checkout magic-link auto-login (v1 = "log in next time"); Resend
branded bilingual templates; anti-fraud table+CAPTCHA on anon
checkout; service-role-in-preview rotation; `subscription_status`
stub-on-create caveat (real payment webhook in Sprint 3).

## Self-audit

- **Email send stubbed** — biggest honest gap; HTML correct, send not
  wired (no account). Test A's "email arrived" step can't pass until
  Resend is configured — flagged.
- **Rate limit is approximate** — reuses `creator_ip_hash` claimed-row
  count (no dedicated table); a determined abuser with rotating IPs
  isn't stopped. Anti-fraud hardening in BACKLOG §5.
- **listUsers scan** for dup-email is `perPage:1000` (fine at current
  4 users; needs pagination/`getUserByEmail` at scale) — createUser's
  own duplicate error is the safety net.
- **Static anon QR (no short_id)** routes `/checkout/draft?…`; page
  resolves via `draft_token` so it still works, but the URL is ugly —
  acceptable (anon is overwhelmingly URL/dynamic).
- **Idempotency** guarded (already-claimed token → success, no 2nd
  user) but not transactionally atomic across createUser+claim; a
  crash between them could orphan a user with an unclaimed draft —
  low risk, flagged.
- Browser smoke not self-run (protected preview) — Usama's pass is
  the real gate.

## Open questions for Usama
1. Resend: provision an account/key this sprint, or keep stub → Sprint 3?
2. Confirm the Supabase Redirect URL add landed (Test B only).
3. OK that `subscription_status='active'` is set at create-time while
   payments are stubbed (documented; flips to webhook-gated Sprint 3)?

---

## Addendum — pre-merge bug & fix

**Symptom (Usama smoke):** `PATCH /api/qr/anonymous/email` → **400**
with body `{error: "Invalid API key"}`; UI message *"email rate limit
exceeded"* (carried over from an earlier LoginModal click — not from
this PATCH).

**Audit:** code intact. Only two `signInWithOtp` references in `src`:
a comment in `auth/claim/route.ts` and the LoginModal magic-link
(legitimate). The Resend wire-up touched only `BACKLOG.md`. Added
one-line `console.info` diagnostics in each submit handler to
disambiguate the path in devtools (`9a3eaaa`).

**Real cause:** `SUPABASE_SERVICE_ROLE_KEY` in Vercel Preview was the
**anon JWT** (`role:"anon"`), not the service-role JWT
(`role:"service_role"`). Both are `eyJ…`; only the embedded claim
distinguishes them. Supabase REST therefore returned its literal
`"Invalid API key"` for every admin call — surfaced through our
routes as 400 (env was *set*, just wrong; if it had been *absent*
we'd see 503 from the `createAdminClient` throw).

**Fixes:**
- Usama replaced the value in the Vercel dashboard with the correct
  `service_role` secret; redeploy (`masaar-45mu5zcz7…`) picked it up
  cleanly.
- `4ff7d8a` — `email-gate-modal.tsx` no longer silently swallows the
  PATCH error. Network error or HTTP `!ok` → parse the server's real
  `{message|error}` and show it (or a clean *"Couldn't save your
  email — please retry"* if opaque); **stay on the modal** so the
  user can retry; **never** show a hardcoded "rate limit" message.

**Post-fix smoke (Usama):** Test A passed end-to-end on the rebuilt
preview — PATCH returns 200, no misleading errors, redirect to
`/checkout`, full flow lands in dashboard. "Invalid API key" closed.

**Lesson learned — Sprint 3 hardening (logged to BACKLOG §5):** an
`"Invalid API key"` from Supabase is a *value*-level issue, not a
*code*-level one. The right defense is to **validate the JWT's
`role` claim at app startup** (decode the SERVICE_ROLE_KEY payload,
assert `role === "service_role"`, fail-fast with a clear error if
wrong) — so an anon-vs-service-role mix-up surfaces immediately on
boot/build instead of as an opaque 400 during a smoke.

---

## Post-merge hotfixes (anon Pay → /login symptom)

**Symptom:** Usama reported anon Pay on `/checkout/[shortId]` was
redirecting to `/auth/login` instead of completing checkout.

**Real cause:** the Pay button correctly POSTed `/api/checkout/anon`
and the POST succeeded — but both the API and the client returned
`redirect_url: "/dashboard?welcome_new_qr=1&first_login=1"`, and
`/dashboard` is middleware-gated; the anon browser has no session
(`admin.createUser` doesn't set cookies), so middleware bounced to
`/login`. Symptom looked like "Pay redirects to login"; really it was
the destination being unreachable.

### Hotfix #1 — `07d85c7` (PR #6)
- New **public** `src/app/checkout/success/page.tsx` confirming
  "Your QR is live!" + welcome-email magic-link hint + Back-to-home.
- `/api/checkout/anon` `redirect_url` and `checkout-client` fallback
  changed to `/checkout/success?email=<encoded>`.
- Middleware verified — only `/dashboard` is gated; `/checkout/*`
  isn't. `checkout-client` error display already surfaces real server
  messages (from §6) — no change needed there.

### Honest correction — earlier A.7 prod "verification" was wrong
The post-A.7-merge check I ran (`POST {} → 400 invalid_email`) was
insufficient: validation rejected the empty body at step 2, *before*
`createAdminClient` was even constructed. The admin-client path was
never exercised. The real situation was that
`SUPABASE_SERVICE_ROLE_KEY` was only in **Preview** scope (not
Production), so anon checkout had silently been 503-ing on prod since
the A.7 merge. Usama's "Pay → /login" bug was on preview; the same
endpoint on prod would have returned 503. I should have done a
valid-payload POST.

### Env-scope fix (Usama, dashboard)
`SUPABASE_SERVICE_ROLE_KEY` scope expanded to **Production + Preview +
Development** (same JWT value; no rotation). Production redeployed via
`vercel redeploy <prod> --target=production` → ● Ready. Confirmed at
this point that the env scope had been the masking issue.

### Hotfix #2 — `c08c27b` (PR #7)
A REAL POST to `/api/checkout/anon` with a valid payload returned 200
but with the OLD `/dashboard?…` `redirect_url`, exposing a second
miss: my Hotfix #1 used `Edit replace_all=true` expecting two
identical occurrences, but lines 65 and 175 had **different leading
whitespace** (6 spaces vs 4), so only line 65 matched. Replaced line
175 explicitly; one-line fix, merged, redeployed.

### Final prod verification (`masaar-pgayht2qr…`, ● Ready)
| Check | Result |
|---|---|
| `/create` wizard renders | 200 + markers (Choose QR type, Complete Content) ✓ |
| Lock-in `/r/pendsmk1` | 302 → `/activate/pendsmk1` ✓ |
| Existing active `/r/WgcQX3E` | 302 → `https://anthropic.com/` ✓ |
| `/checkout/success` (public) | 200 ✓ |
| **`POST /api/checkout/anon` (valid payload)** | **200**, `success:true`, `redirect_url:"/checkout/success?email=…"` ✓ |

Welcome email reported `email_delivery: "failed"` — Resend's
`onboarding@resend.dev` test-mode restriction with `+alias` recipients
(documented in BACKLOG §5); lifts in Sprint 3 with a verified domain.

### Sprint 3 hardening — bumped priority (BACKLOG §5)
- **JWT role-claim assertion at app startup** (catches wrong-paste at
  boot, not during a smoke).
- **CI env-scope assertion**: before promoting to production, run a
  `vercel env ls production` check that asserts
  `SUPABASE_SERVICE_ROLE_KEY` is present in the Production scope.
  Would have caught the masked 503 pre-merge.

### Test data left in place (per Usama)
- Draft rows: `hfvrfy7` (claimed by first verify POST), `hfvrfy8`
  (claimed by second verify POST).
- `auth.users` rows: `usamaahmed047+a7hotfixverify@gmail.com`,
  `usamaahmed047+a7verify2@gmail.com`.
- To be purged in the launch-prep sweep alongside the other SMOKE
  rows.

### Branches kept
`hotfix/anon-checkout-pay-button` (PR #6) and
`hotfix/anon-checkout-redirect-url-line175` (PR #7) preserved for
history per instruction.
