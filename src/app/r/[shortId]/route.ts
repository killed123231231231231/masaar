import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { UAParser } from "ua-parser-js";
import { parseHttpUrl } from "@/lib/url";
import { supabaseUrl, supabaseAnonKey } from "@/lib/env";

// Edge runtime is fast and exposes Vercel geo headers
export const runtime = "edge";

/**
 * Redirect handler for dynamic QRs.
 *
 * 1. Look up the shortId in Supabase to get the destination URL.
 * 2. Log the scan with country/city/device/browser parsed from request headers.
 * 3. 302 redirect to the destination.
 *
 * The whole round-trip is sub-100ms on Vercel edge — fast enough that the
 * scanning device never perceives the indirection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;

  // Edge runtime — use a stateless server client (no cookies needed,
  // we rely on RLS policy `qr_codes_public_read_active`).
  const supabase = createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  // Resolve via a SECURITY DEFINER function (migration 004): qr_codes has
  // no public read policy, so anon cannot select password_hash /
  // payload_json. resolve_qr_v2 returns (id, destination, status,
  // content_type) for *any* row (status branching happens here, not in SQL).
  const { data, error } = await supabase.rpc("resolve_qr_v2", {
    p_short_id: shortId,
  });
  const qr = Array.isArray(data) ? data[0] : null;

  if (error || !qr) {
    return new NextResponse("QR code not found", { status: 404 });
  }

  // Drafts are never resolvable — they only exist mid-build, pre-save.
  if (qr.status === "draft") {
    return new NextResponse("QR code not found", { status: 404 });
  }

  // Where the scan ultimately goes:
  //  - active           → the real destination (must be valid http(s))
  //  - pending_payment  → /activate/[shortId] lock-in page
  //  - suspended        → /expired/[shortId] page
  // pending/suspended STILL log the scan (the owner sees scan activity
  // even on an unpaid/suspended QR — that's the lock-in dopamine).
  let redirectTo: string;
  if (qr.status === "active") {
    // A destination of "https://", a scheme-less string, javascript:/data:,
    // or a non-URL payload would otherwise throw inside
    // NextResponse.redirect (500 on every scan). Don't log a broken active
    // scan (preserves prior behavior).
    const target = parseHttpUrl(qr.destination);
    if (!target) {
      return new NextResponse("QR code not found", { status: 404 });
    }
    redirectTo = target.toString();
  } else if (qr.status === "pending_payment") {
    redirectTo = new URL(`/activate/${shortId}`, request.url).toString();
  } else {
    // suspended
    redirectTo = new URL(`/expired/${shortId}`, request.url).toString();
  }

  // Extract scan metadata
  const ua = request.headers.get("user-agent") || "";
  const parsed = new UAParser(ua).getResult();
  const country = request.headers.get("x-vercel-ip-country");
  const city = decodeSafe(request.headers.get("x-vercel-ip-city"));
  const region = request.headers.get("x-vercel-ip-country-region");

  // Hash the IP for privacy — store first 16 chars of SHA-256
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256(ip);

  // Await the insert. On the edge runtime a fire-and-forget promise is
  // torn down when the response returns, so scans were being dropped
  // non-deterministically. One insert keeps the hop well under the
  // ~100ms budget. (next@15.0.3 only ships unstable_after, which needs
  // experimental.after and is unstable on edge — unfit for this path.)
  await supabase.from("scans").insert({
    qr_code_id: qr.id,
    country,
    region,
    city,
    device_type: parsed.device.type ?? "desktop",
    os: parsed.os.name ?? null,
    browser: parsed.browser.name ?? null,
    user_agent: ua,
    ip_hash: ipHash,
  });

  return NextResponse.redirect(redirectTo, 302);
}

function decodeSafe(v: string | null): string | null {
  if (!v) return null;
  try { return decodeURIComponent(v); } catch { return v; }
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
