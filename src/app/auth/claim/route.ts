import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing for the anonymous funnel. The email-gate modal
 * sends a Supabase OTP link with emailRedirectTo = /auth/claim?
 * draft_token=…. Here we:
 *   1. exchange the PKCE code for a session (cookie-aware server client
 *      reads the verifier cookie the browser set during signInWithOtp)
 *   2. claim_draft_qrs(draft_token) — adopt the user_id-NULL draft rows
 *   3. redirect to /checkout/[shortId] for the freshest claimed QR
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const draftToken = url.searchParams.get("draft_token");

  const abs = (path: string) => new URL(path, request.url).toString();

  // B7/P1-4 — there is no standalone /login page; bounce auth errors to
  // the landing with the login modal pre-opened (?login=1). The ?error=
  // tag rides along for debugging/future surfacing; the modal opens
  // regardless so the user has an obvious recovery path (re-enter email
  // → "Send me a setup link").
  if (!code) {
    return NextResponse.redirect(abs("/?login=1&error=missing_code"), 303);
  }

  const supabase = await createClient();
  const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchErr) {
    return NextResponse.redirect(abs("/?login=1&error=link_expired"), 303);
  }

  let target = "/dashboard?welcome=1";
  if (draftToken) {
    const { data, error } = await supabase.rpc("claim_draft_qrs", {
      p_draft_token: draftToken,
    });
    const shortId = Array.isArray(data) ? data[0]?.short_id : undefined;
    if (!error && shortId) {
      target = `/checkout/${shortId}`;
    }
  }

  return NextResponse.redirect(abs(target), 303);
}
