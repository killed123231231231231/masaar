# Sprint 2 — Session A.5 Report: Builder Wizard Restructure

Branch `sprint-2/session-a5-wizard` off `main@6a85cf9`. **Not merged**
(per instruction). Every commit `tsc` + `next build` green.

## Commits shipped

- `2eae343` wizard shell + Step 1 (16 cards) + Step 2 URL/Text/vCard + minimal Step 3 + funnel wiring (keystone — landed cohesively; wizard-client imports all steps so a split would ship broken intermediates)
- `66ee75f` diag #1 — authoritative **live** auth check at Download (server `isAuthed` prop was a stale snapshot)
- `6450f6b` Step 2 remaining real forms — WiFi, Email, SMS, Phone, WhatsApp, App Link
- `04b64bb` Step 3 — collapsible Frame/Customization/Logo/Protect + **live debounced** QrPreview, stable client short_id
- `722e57c` email-gate "Last Step!" + T&C + `/terms` `/privacy` stubs + LoginModal (Google stubbed)
- (final) mobile sticky footer + this report

## Diagnostics requested

1. **Auth detection** — the wizard's `page.tsx` auth read is logic-identical to the Session A page that worked; the real fault was the **stale SSR `isAuthed` prop** (bfcache / cross-origin preview cookie / login-in-another-tab). Fixed: `download()` now reads the live session via the browser Supabase client and branches on that; `EmailGateModal` is always mounted so the anon path can open it regardless of the prop. A logged-in active subscriber → no gate → `/api/qr` → `status=active` → toast + `/dashboard?welcome_new_qr=1`.
2. **Claim → /checkout** — `/auth/claim` is **already spec-correct**: PKCE exchange → `claim_draft_qrs(draft_token)` → `303 /checkout/[shortId]` if a draft was claimed (else `/dashboard?welcome=1`; exchange-fail → `/login?error=link_expired`). No code bug. The "stuck after magic-link" cause is environmental: the **new preview origin isn't in Supabase Auth → Redirect URLs**, so the link bounces to the Site URL where the PKCE verifier cookie doesn't exist. **Action (Usama, dashboard-only):** add `https://masaar-git-sprint-2-session-a5-wizard-qasimahmed4444s-projects.vercel.app/auth/claim` and `…/**` to Supabase Auth Redirect URLs.

## Acceptance criteria

| # | Status |
|---|--------|
| 1 wizard shell + 3-step bar | ✅ |
| 2 Step 1 grid + MOST USED + right panel | ✅ (15 spec types **+ Text** = 16; Text needed for first-half forms — flagged) |
| 3 Step 2 per-type form + content-aware preview + validate | ✅ for the 9 backend-ready types; not-ready types show a stub message |
| 4 Step 3 4 sections + live debounced preview | ✅ (Frame = basic only; full library is Session I) |
| 5 URL auto-prepend | ✅ (reuses `normalizeUrl`) |
| 6 subscriber skips checkout | ✅ (live auth check + existing Bug 9 path) |
| 7 email-gate "Last Step!" + T&C + login link | ✅ |
| 8 login modal + stubbed Google | ✅ |
| 9 progress bar clickable to completed steps | ✅ |
| 10 localStorage persistence + clear-on-success | ✅ |
| 11 mobile responsive @375px | ◑ responsive by construction (grids/labels collapse, footer sticky) — not device-verified by me |
| 12 all 15 types end-to-end | ◑ 9 backend-ready types work; pdf/image/video/location/feedback/menu/payment are stubs (their backends are Sessions C/D/F) |
| 13 Step 3 no flicker (300ms) | ✅ debounced |
| 14 `npm run build` green | ✅ |
| 15 self-audit | ✅ (below) |

## Stubbed / deferred (in scope of *other* sessions)

- PDF/Image/Video/Location/Feedback/Menu/Payment Step-2 forms — backends are Sessions C/D/F; wizard shows a clear "later session" placeholder and Next is blocked for them.
- Frame library beyond basic — Session I.
- Logo preset library, logo scale slider — Session I (custom upload works, authed-only).
- Password protect — **UI only, deliberately NOT submitted** (no plaintext); scan-time enforcement is Session I.
- Real Google OAuth — stubbed toast (Supabase+Google config dependency).

## Self-audit (honest)

- **Cohesive keystone commit** — `2eae343` bundles shell+S1+S2-first-half+minimal-S3+wiring because wizard-client imports every step; splitting would ship broken builds. Flagged at the pause; accepted.
- **Harness limit** — the preview is Vercel Deployment-Protected (401 anon) and screenshot tooling times out here, so the 15-type click-through smoke and mobile@375px are **not driven/verified by me**; they reuse Session-A-verified routes/encoders. This is Usama's logged-in smoke.
- **Password UI without backend** could imply protection that isn't enforced yet — mitigated by an inline note and by NOT persisting it.
- **Live preview short_id** is generated once and persisted in `masaar.wizard_state`; matches the QR that gets saved (Session A invariant) — but if the user clears storage mid-flow a new id is minted (expected).
- Email-gate is only consumed by `/create` (legacy create-client removed), so the copy/flow change has no other blast radius.

## Time spent
Not instrumented. Delivered: keystone + 2 diagnostics + all 9 real Step-2 forms + full Step-3 + auth modals/legal stubs + mobile footer, in scoped commits.

## Open questions for Usama
1. Confirm the Supabase Auth Redirect URL addition for the new preview alias (blocks anon-claim smoke).
2. "Text" added as a 16th Step-1 card (real backend kind, needed for the first-half forms) — keep, or fold away?
3. Password section: keep as visible UI now (enforcement Session I) or hide until Session I ships?
4. Per-type stub polish (Payment waitlist, Menu→Session F routing) — do it here later or leave the generic placeholder until those sessions?
