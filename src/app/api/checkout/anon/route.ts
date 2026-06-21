import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

// Email-holding frictionless checkout (spec §2). Node runtime — needs
// the service-role admin client + email send. Payment is stubbed while
// PAYMENTS_ENABLED!=='true'; when it flips, gate steps 4-7 behind a
// real payment-confirmation webhook (Sprint 3).
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLANS = ["starter", "pro", "menu_pro"];
const PROD = "https://quickqrcode.live";

async function sha256_16(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const draftToken = String(body.draft_token || "");
  const plan = String(body.plan || "");

  if (!EMAIL.test(email))
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (!UUID.test(draftToken))
    return NextResponse.json({ error: "invalid_draft" }, { status: 400 });
  if (!PLANS.includes(plan))
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY not in this environment's scope.
    return NextResponse.json(
      { error: "checkout_unavailable" },
      { status: 503 }
    );
  }

  // Draft rows for this token. Matches the migration 015 hardening on
  // claim_draft_qrs — only unclaimed, pending, recent rows count. Without
  // these filters a stale localStorage token from a prior abandoned
  // session matches old orphan rows and silently attaches them to the
  // new user (see SPRINT2.md 2026-05-24 contamination fix entry).
  const draftCutoff = new Date(Date.now() - 24 * 3600_000).toISOString();
  // C2 — order newest-first so we claim ONLY the single most-recent draft
  // (the QR being checked out), never the whole pile sharing this token.
  const { data: draftRows, error: draftErr } = await admin
    .from("qr_codes")
    .select("id, short_id, user_id")
    .eq("draft_token", draftToken)
    .is("user_id", null)
    .eq("status", "pending_payment")
    .gte("created_at", draftCutoff)
    .order("created_at", { ascending: false });
  if (draftErr)
    return NextResponse.json({ error: draftErr.message }, { status: 400 });
  if (!draftRows || draftRows.length === 0)
    return NextResponse.json({ error: "invalid_draft" }, { status: 400 });

  // (Pre-015 carried an idempotency check here — `draftRows.every(r => r.user_id)`.
  // Post-015 it can never fire because the SELECT now filters `user_id IS NULL`
  // and the claim UPDATE nulls draft_token, so retry SELECTs return zero rows
  // and fall through to the invalid_draft 400 above. The Pay button's `busy`
  // state already prevents the double-click race in practice.)

  // Approximate per-IP rate limit (5 successful anon checkouts / hour),
  // reusing creator_ip_hash — no new table (anti-fraud hardening in
  // BACKLOG). Best-effort: never block a legit first checkout.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256_16(ip);
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count: recentClaims } = await admin
    .from("qr_codes")
    .select("id", { count: "exact", head: true })
    .eq("creator_ip_hash", ipHash)
    .not("user_id", "is", null)
    .gte("created_at", since);
  if ((recentClaims ?? 0) >= 5) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many checkouts from this network. Try again later." },
      { status: 429 }
    );
  }

  // Email already registered? No silent merge — tell them to log in.
  const { data: list } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const exists = list?.users?.some(
    (u) => (u.email || "").toLowerCase() === email
  );
  if (exists) {
    return NextResponse.json(
      {
        error: "email_already_registered",
        message: "This email already has an account. Please log in instead.",
        login_url: `/?login=1&email=${encodeURIComponent(email)}`,
      },
      { status: 409 }
    );
  }

  // B5/Fix 22 — generate a secure random password at account creation
  // and include it in the welcome email. Lets users log in immediately
  // with email+password (no password-reset round trip). Bug 16's reset
  // flow stays as the fallback for lost-email cases.
  // base64url over 12 bytes = 16-char alphanumeric; satisfies Supabase's
  // default 6-char minimum and gives ~96 bits of entropy.
  const generatedPassword = randomBytes(12).toString("base64url");

  // Payment is proof of email ownership → skip confirmation.
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: { signup_source: "frictionless_checkout" },
  });
  if (cErr || !created?.user) {
    // createUser's own duplicate guard, as a safety net.
    if (cErr?.message?.toLowerCase().includes("registered")) {
      return NextResponse.json(
        {
          error: "email_already_registered",
          message: "This email already has an account. Please log in instead.",
          login_url: `/?login=1&email=${encodeURIComponent(email)}`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: cErr?.message || "user_create_failed" },
      { status: 400 }
    );
  }
  const userId = created.user.id;

  // Claim the draft QR(s) onto the new account + activate. Mirrors the
  // migration 015 hardening on claim_draft_qrs — pending_payment +
  // recent + unclaimed only. The same filters live on the discovery
  // SELECT above; redundant here intentionally as a belt-and-suspenders
  // race guard between SELECT and UPDATE.
  // C2 — claim/activate ONLY the single most-recent draft (the one being
  // checked out), not every draft sharing this token. Stray anon QRs stay
  // unclaimed so a new account never inherits a pile.
  const targetDraftId = draftRows[0].id;
  const { data: claimed, error: upErr } = await admin
    .from("qr_codes")
    .update({
      user_id: userId,
      creator_email: email,
      status: "active",
      draft_token: null,
    })
    .eq("id", targetDraftId)
    .is("user_id", null)
    .eq("status", "pending_payment")
    .select("id, short_id");
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 400 });

  // profiles row is auto-created by handle_new_user — flag the sub.
  await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
    })
    .eq("id", userId);

  // B5/Audit Finding 2 — derive the QR image URL from the actual
  // request origin instead of the hardcoded PROD constant. The email
  // is then self-consistent with the deploy the user just checked out
  // on: prod-checkout -> prod render URL (has the logo composite
  // shipped on main); preview-checkout -> preview render URL (has
  // whatever's on the branch). The old hardcoded PROD broke logo
  // rendering for any preview-deploy testing because preview-only
  // fixes never landed at masaar-zeta.vercel.app.
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : PROD;

  // Welcome email (stubbed if no RESEND key).
  const first = claimed?.[0];
  let emailResult = { sent: false, stubbed: true } as Awaited<
    ReturnType<typeof sendWelcomeEmail>
  >;
  if (first) {
    emailResult = await sendWelcomeEmail({
      to: email,
      shortId: first.short_id || first.id,
      qrImageUrl: `${origin}/api/qr/${first.id}/render.png?size=512`,
      // B5/Audit — also pass origin so the email body's "Manage your
      // QR" + "Log in at" links match the deploy that sent this email
      // (was hardcoded PROD, broke preview-test flow self-consistency).
      origin,
      // B5/Fix 22 — include the generated password so the user can log
      // in immediately. Sent in plain text in the email body, clearly
      // marked, with "change anytime in Settings" instructions.
      generatedPassword,
    });
  }

  return NextResponse.json({
    success: true,
    redirect_url: `/checkout/success?email=${encodeURIComponent(email)}`,
    email_delivery: emailResult.sent
      ? "sent"
      : emailResult.stubbed
        ? "stubbed"
        : "failed",
  });
}
