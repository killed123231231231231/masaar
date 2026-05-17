# Masaar (مسار) — Branded QR codes with live tracking

A full-stack QR code platform inspired by getqr.com. Build dynamic QR codes with
logos, custom colors, and real-time scan analytics — edit the destination at any
time without reprinting the QR.

> **Stack**: Next.js 15 (App Router) · Supabase (Postgres + Auth + Storage) · Vercel · TypeScript · Tailwind · qr-code-styling · Recharts

---

## What's in this scaffold

| Feature | Status |
|---|---|
| Landing page with Masaar branding | Done |
| Email/password auth (Supabase) | Done |
| Dashboard listing all of a user's QRs | Done |
| Create QR — 7 content types (URL / text / vCard / WiFi / email / SMS / phone) | Done |
| Live QR preview with colors, gradients, dot styles, corner styles | Done |
| Download as PNG / SVG / JPG | Done |
| Dynamic short-URL routing (`/r/[shortId]`) | Done |
| Edge-runtime redirect handler that logs every scan | Done |
| Per-QR analytics: time series, country/city/device/browser/OS | Done |
| Edit destination of dynamic QR after creation | Done |
| Row Level Security so users can only see their own data | Done |
| Logo upload (UI + Supabase Storage bucket) | Stubbed — bucket exists, upload UI TODO |
| Frames with call-to-action text | Stubbed |
| PDF export | Stubbed — pdf-lib installed, button TODO |
| Password-protected QRs | Stubbed — column exists, gate TODO |
| Folders for organizing QRs | Stubbed — table exists, UI TODO |
| Realtime "live scan" feed (Supabase Realtime) | Stubbed |
| Payments | Out of scope per your spec |

The stubbed items are intentionally one-Claude-Code-prompt away — the schema, libs,
and UI scaffolding are in place; you just need to wire up the components.

---

## 1 · Run it locally in 5 minutes

```bash
# In the masaar/ folder
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see step 2)
npm run dev
# → http://localhost:3000
```

## 2 · Set up Supabase

1. Go to https://supabase.com → **New project** (region: `eu-west-3` Paris or `ap-south-1` Mumbai are closest to GCC).
2. **Project Settings → API** — copy the **Project URL** and **anon public key** into `.env.local`.
3. **SQL Editor → New query** — paste the entire contents of `supabase/migrations/001_initial_schema.sql` and run.
4. **Authentication → Providers** — leave email enabled. Add Google/GitHub OAuth later when you decide.
5. **Authentication → URL Configuration** — set Site URL to `http://localhost:3000` for dev (and your production domain later).

That's it. Sign up at `/signup` and you're in.

## 3 · Deploy to Vercel

```bash
# Inside masaar/
git init && git add . && git commit -m "Initial Masaar scaffold"
gh repo create masaar --private --source=. --push    # or push manually
```

Then on https://vercel.com:

1. **New Project** → import the GitHub repo.
2. Add the three environment variables from `.env.local.example`. Make sure `NEXT_PUBLIC_APP_URL` is your production domain (e.g. `https://masaar.sa`).
3. Click **Deploy**.
4. Back in Supabase → **Authentication → URL Configuration**, set the production URL and add it to "Redirect URLs".

`vercel.json` already pins the build region to **Frankfurt + Mumbai**, the
closest edge regions to the GCC. Adjust if you have a Vercel Enterprise plan with KSA edges.

---

## 4 · How dynamic QRs work — the key trick

This is the core architecture. Worth understanding before extending.

```
                    ┌────────────────────────────────────────┐
   USER prints      │                                        │
   poster with  ──→ │ QR encodes:  https://masaar.sa/r/abc12 │
   one QR code      │                                        │
                    └────────────────────────────────────────┘
                                       │
                                       ▼ scan
                    ┌────────────────────────────────────────┐
                    │  Vercel edge route /r/[shortId]        │
                    │  1. supabase: SELECT destination       │
                    │  2. parse UA, read x-vercel-ip-*       │
                    │  3. INSERT into scans table            │
                    │  4. 302 → real destination URL         │
                    └────────────────────────────────────────┘
                                       │
                                       ▼
                    ┌────────────────────────────────────────┐
                    │ User lands on https://yourbrand.com/x  │
                    └────────────────────────────────────────┘
```

The user can change the destination URL anytime in the dashboard — the short
link `/r/abc12` keeps pointing wherever you tell it to. The QR on the poster
never needs to be reprinted.

Geo data is **free** from `x-vercel-ip-country` and `x-vercel-ip-city`
headers — no third-party IP geolocation service required.

---

## 5 · Project structure

```
masaar/
├── README.md
├── CLAUDE.md                                ← auto-loaded by Claude Code
├── CLAUDE_CODE_HANDOFF.md                   ← step-by-step handoff guide
├── FIRST_SESSION_PROMPT.md                  ← senior-engineer kickoff prompt
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── .env.local.example
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql           ← run this in SQL editor
└── src/
    ├── middleware.ts                        ← protects /dashboard routes
    ├── app/
    │   ├── layout.tsx                       ← global fonts (Inter + Cairo for Arabic)
    │   ├── globals.css
    │   ├── page.tsx                         ← marketing landing page
    │   ├── login/page.tsx
    │   ├── signup/page.tsx
    │   ├── auth/signout/route.ts
    │   ├── api/qr/route.ts                  ← POST/PATCH for QR codes
    │   ├── r/[shortId]/route.ts             ← EDGE redirect + scan logger
    │   └── dashboard/
    │       ├── page.tsx                     ← lists all user's QRs
    │       └── qr/
    │           ├── new/
    │           │   ├── page.tsx
    │           │   └── new-client.tsx
    │           └── [id]/
    │               ├── page.tsx             ← edit destination
    │               ├── edit-client.tsx
    │               └── analytics/
    │                   ├── page.tsx
    │                   └── analytics-client.tsx
    ├── components/
    │   ├── dashboard-shell.tsx
    │   ├── qr-customizer.tsx                ← form + style controls
    │   └── qr-preview.tsx                   ← live preview + download
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                    ← browser client
    │   │   ├── server.ts                    ← server client (uses cookies)
    │   │   └── middleware.ts                ← session refresh
    │   ├── qr.ts                            ← qr-code-styling wrapper
    │   ├── content-types.ts                 ← vCard/WiFi/email/SMS encoders
    │   ├── shortid.ts                       ← nanoid-based shortIds
    │   └── utils.ts
    └── types/
        └── database.ts                      ← regenerate via supabase gen types
```

---

## 6 · Building further with Claude Code

This scaffold is designed to be extended with Claude Code. Suggested next prompts:

### Prompt 1 — Logo upload
> Wire up logo upload in `src/components/qr-customizer.tsx`. Add a file input.
> On change, upload to Supabase Storage bucket `logos` under
> `{user_id}/{nanoid}.png`. Get the public URL, persist as `logo_url` on the
> qr_codes row, and pass `logoDataUrl` to the preview.

### Prompt 2 — Realtime "live scan" feed
> On the analytics page, subscribe to the `scans` table via Supabase Realtime
> filtered by `qr_code_id`. Show new rows in a "Live scans" feed at the top,
> animating in with framer-motion.

### Prompt 3 — Frames around the QR
> Add a `<QrFrame>` component that wraps `<QrPreview>` in a frame with a
> call-to-action label below (e.g. "SCAN ME"). Frame styles: rounded box,
> arrow-down, label-only. Persist `frame_style` and `frame_text` on save.

### Prompt 4 — Password-protected QRs
> When a QR has a `password_hash`, the `/r/[shortId]` route should render a
> password gate page instead of redirecting. On correct password, set a cookie
> and redirect. Use bcrypt via `bcryptjs`.

### Prompt 5 — PDF export
> Add a "Download PDF" button in `QrPreview`. Use `pdf-lib` to embed the QR
> SVG into an A4 page with the QR centered and the QR's name above it.

### Prompt 6 — Folders
> Add a sidebar to the dashboard with the user's folders. Allow drag-and-drop
> of QR cards into folders. Update `folder_id` on drop.

---

## 7 · Security notes

- **Row Level Security is enforced on all four tables**, so even if you write a
  buggy query that doesn't filter by `user_id`, Supabase won't return rows
  that aren't yours.
- The redirect handler uses the anon key and relies on the
  `qr_codes_public_read_active` RLS policy — it reads *only* `is_active = true`
  rows. Inactive QRs return 404.
- IPs are **hashed (SHA-256, truncated)** before storage. No raw IPs hit the database.
- Service-role key is `.env.local` only, never exposed to the client bundle.

---

## 8 · GCC / Arabic considerations

- The layout pulls in **Cairo** (Arabic) alongside **Inter** — already wired up via Next.js fonts.
- For full RTL support, set `dir="rtl"` on `<html>` when the locale is Arabic and add `next-intl` for translations.
- The Vercel deploy region is set to `fra1, bom1` — closest to KSA. With a Vercel Enterprise plan you can request `ksa1` (Saudi data residency).
- Suggested domains: **masaar.sa**, **masaar.io**, **masaarqr.com**, **getmasaar.com**.

---

## License

This is **your** project — no license claim from the scaffold. Pick what you want (MIT, AGPL, proprietary).

The visual identity, brand name "Masaar", and feature concepts are inspired by
GetQR — feature parity is fine, but don't ship copying their exact copy or brand assets.
