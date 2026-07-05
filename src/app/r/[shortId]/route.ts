import { NextRequest, NextResponse, after } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { UAParser } from "ua-parser-js";
import { qrTarget } from "@/lib/qr-target";
import { supabaseUrl, supabaseAnonKey } from "@/lib/env";
import {
  qrCacheGet,
  qrCacheSet,
  qrCacheDelete,
  qrCacheEnabled,
  toCachedQr,
  type CachedQr,
} from "@/lib/qr-edge-cache";

// Edge runtime is fast and exposes Vercel geo headers
export const runtime = "edge";
// Pin the scan function to Mumbai (bom1) — the SAME region as the Supabase
// project (ap-south-1). The hot path is a single resolve_qr_v2 round-trip, so
// co-locating turns it from a cross-region hop (~300ms) into an intra-region
// one (~10ms). Mumbai is also the nearest region to the GCC / South-Asia
// scanners, so the whole redirect collapses to roughly one short network hop —
// no cache, so the redirect stays live (Active/Inactive toggle stays instant).
export const preferredRegion = "bom1";
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

  // OUTAGE ARMOR — cache-first resolve. The Upstash edge cache holds a
  // copy of each QR's routing fields, so a printed QR keeps redirecting
  // even when Supabase can't answer (the June-2026 free-tier 402 outage
  // 404'd every printed QR for hours). Source of truth stays the DB:
  // a hit is revalidated against resolve_qr_v2 in after() below, so an
  // owner toggle/edit corrects the cache within one scan. With no cache
  // env configured this returns null instantly and the flow is identical
  // to the pre-cache behaviour.
  const cached = await qrCacheGet(shortId);
  const cacheState = !qrCacheEnabled() ? "off" : cached ? "hit" : "miss";
  let qr: CachedQr | null = cached;

  if (!qr) {
    // Resolve via a SECURITY DEFINER function (migration 004): qr_codes has
    // no public read policy, so anon cannot select password_hash /
    // payload_json. resolve_qr_v2 returns (id, destination, status,
    // content_type) for *any* row (status branching happens here, not in SQL).
    const { data, error } = await supabase.rpc("resolve_qr_v2", {
      p_short_id: shortId,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) return notFound();
    qr = toCachedQr(row);
  }

  // Fail CLOSED: the real destination is reachable on EXACTLY one
  // status ('active'). Every other value — pending_payment, suspended,
  // draft, or any unexpected/missing status — routes to a lock-in /
  // dead-end / 404, never the destination. A desynced or stale
  // resolver can therefore never leak a non-active destination.
  let redirectTo: string;
  if (qr.status === "active") {
    // C — file content types (pdf/image/video) render on the hosted /v
    // page rather than redirecting to the raw asset URL. This keeps the
    // Masaar wrapper (OG tags, footer, mobile PDF CTA) and a consistent
    // scan log. The asset URL still lives in `destination`; /v resolves it.
    if (qr.has_password) {
      // I — password-protected: gate at /unlock (node), which verifies the
      // unlock cookie and only then redirects onward to the real target.
      redirectTo = new URL(`/unlock/${shortId}`, request.url).toString();
    } else {
      // Hosted types (pdf/image/video/social/location/feedback) render on our
      // own pages; url/static go to their destination. A bad destination
      // ("https://", javascript:, non-URL) returns null → 404 instead of
      // throwing a 500 inside NextResponse.redirect.
      const t = qrTarget(shortId, qr.content_type, qr.destination);
      if (!t) return notFound();
      redirectTo = t.startsWith("/") ? new URL(t, request.url).toString() : t;
    }
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

  // Everything below runs AFTER the redirect is sent, so the bounce is
  // instant. `after` (stable since Next 15.1 — we're on 15.5) keeps the
  // function alive until the work resolves — unlike a bare fire-and-forget
  // promise, which the edge runtime tears down with the response.
  //
  // 1. Cache maintenance runs for EVERY request (bots included — the
  //    warm-up curl is how a fresh deploy seeds the cache):
  //    miss → seed from the row we just resolved; hit → revalidate
  //    against the DB so toggles/edits/deletes correct themselves within
  //    one scan (if the DB is down the cached copy simply survives —
  //    that's the armor); row gone → purge.
  // 2. Scan logging stays human-only and is wrapped so a logging failure
  //    (e.g. DB outage while serving from cache) can never break a scan.
  const resolvedQr = qr;
  after(async () => {
    try {
      if (cacheState === "hit") {
        const { data, error } = await supabase.rpc("resolve_qr_v2", {
          p_short_id: shortId,
        });
        const row = Array.isArray(data) ? data[0] : null;
        if (row) await qrCacheSet(shortId, toCachedQr(row));
        else if (!error) await qrCacheDelete(shortId);
      } else if (cacheState === "miss") {
        await qrCacheSet(shortId, resolvedQr);
      }
    } catch {
      /* cache upkeep must never break a scan */
    }
    if (!isBot) {
      try {
        await supabase.rpc("log_scan", {
          p_qr_code_id: resolvedQr.id,
          p_country: country,
          p_region: region,
          p_city: city,
          p_device_type: parsed.device.type ?? "desktop",
          p_os: parsed.os.name ?? null,
          p_browser: parsed.browser.name ?? null,
          p_user_agent: ua,
          p_ip_hash: ipHash,
        });
      } catch {
        /* logging must never break a scan */
      }
    }
  });

  const res = NextResponse.redirect(redirectTo, 302);
  for (const [k, v] of Object.entries(NO_STORE)) res.headers.set(k, v);
  // Observability + deploy verification: off = no cache env configured,
  // miss = served from DB (cache seeded in after), hit = served from cache.
  res.headers.set("x-masaar-rcache", cacheState);
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
