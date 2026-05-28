import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { UAParser } from "ua-parser-js";
import { parseHttpUrl } from "@/lib/url";
import { supabaseUrl, supabaseAnonKey } from "@/lib/env";

// Edge runtime is fast and exposes Vercel geo headers
export const runtime = "edge";
// The redirect target depends on the QR's *live* status — it must never
// be cached at the route, data/fetch, or CDN/browser layer, or a QR
// flipped to pending_payment would keep 302-ing to its destination
// (lock-in bypass). force-dynamic + no-store closes that entire class.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "CDN-Cache-Control": "no-store",
} as const;

function notFound() {
  return new NextResponse("QR code not found", {
    status: 404,
    headers: NO_STORE,
  });
}

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

  if (error || !qr) return notFound();

  // Fail CLOSED: the real destination is reachable on EXACTLY one
  // status ('active'). Every other value — pending_payment, suspended,
  // draft, or any unexpected/missing status — routes to a lock-in /
  // dead-end / 404, never the destination. A desynced or stale
  // resolver can therefore never leak a non-active destination.
  let redirectTo: string;
  if (qr.status === "active") {
    // A destination of "https://", a scheme-less string, javascript:/data:,
    // or a non-URL payload would otherwise throw inside
    // NextResponse.redirect (500 on every scan). Don't log a broken active
    // scan (preserves prior behavior).
    const target = parseHttpUrl(qr.destination);
    if (!target) return notFound();
    redirectTo = target.toString();
  } else if (qr.status === "pending_payment") {
    // Still logs the scan below — owner sees activity on an unpaid QR.
    redirectTo = new URL(`/activate/${shortId}`, request.url).toString();
  } else if (qr.status === "suspended") {
    redirectTo = new URL(`/expired/${shortId}`, request.url).toString();
  } else {
    // draft or anything unexpected — never resolvable.
    return notFound();
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

  // B7/P2-1 — log via the log_scan() definer; the open scans_anon_insert
  // policy (WITH CHECK true) was dropped, so direct table inserts no
  // longer work. Skip obvious bots / link-preview fetchers so they don't
  // inflate scan counts — a real camera scan opens the URL with a normal
  // browser UA, so humans still log; only the regex runs on the hot path.
  const isBot =
    /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|skype|preview|monitor|curl|wget|headless|python-requests|axios|go-http|node-fetch/i.test(
      ua
    );

  // Await the call. On the edge runtime a fire-and-forget promise is torn
  // down when the response returns, so scans were being dropped
  // non-deterministically. One RPC keeps the hop well under the ~100ms
  // budget. (next@15.0.3 only ships unstable_after, which needs
  // experimental.after and is unstable on edge — unfit for this path.)
  if (!isBot) {
    await supabase.rpc("log_scan", {
      p_qr_code_id: qr.id,
      p_country: country,
      p_region: region,
      p_city: city,
      p_device_type: parsed.device.type ?? "desktop",
      p_os: parsed.os.name ?? null,
      p_browser: parsed.browser.name ?? null,
      p_user_agent: ua,
      p_ip_hash: ipHash,
    });
  }

  const res = NextResponse.redirect(redirectTo, 302);
  for (const [k, v] of Object.entries(NO_STORE)) res.headers.set(k, v);
  return res;
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
