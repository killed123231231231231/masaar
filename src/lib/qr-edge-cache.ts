// Edge-resilience cache for the /r scan redirect.
//
// WHY: /r's only dependency is one resolve_qr_v2 round-trip to Supabase —
// which means a Supabase outage (June 2026: org hit its free-tier egress
// quota → every request 402'd → printed QRs 404'd for hours) takes every
// printed QR down with it. This module keeps a copy of each QR's routing
// fields (destination/status/password/content_type) in Upstash Redis via
// its REST API, so /r can resolve scans even when the database can't
// answer. Supabase stays the source of truth: every scan revalidates the
// cached entry in the background (see /r), and the /api/qr mutations
// write through on create/edit/toggle/delete.
//
// Runtime: /r is an EDGE function — so this is plain fetch() against the
// Upstash REST endpoint, no SDK, no Node APIs, zero new dependencies.
//
// Failure posture: the cache must never make anything worse. No env vars
// configured → every call no-ops (conn() returns null) and /r behaves
// exactly as before. Upstash slow/down → short timeouts + try/catch make
// /r fall through to the DB path. Both backends down → 404, same as today.

export interface CachedQr {
  id: string;
  destination: string;
  status: string;
  content_type: string;
  has_password: boolean;
}

// Vercel's Upstash integration injects KV_REST_API_* (legacy Vercel KV
// naming) or UPSTASH_REDIS_REST_* (marketplace naming) depending on how
// the store was created — accept either so the storage hookup "just works".
function conn(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function qrCacheEnabled(): boolean {
  return conn() !== null;
}

const key = (shortId: string) => `qr:${shortId}`;

/** Map a row from either source onto the cached shape:
 *  resolve_qr_v2 rows carry content_type + has_password; qr_codes table
 *  rows carry content_kind + password_hash. */
export function toCachedQr(row: {
  id: string;
  destination: string;
  status: string;
  content_type?: string | null;
  content_kind?: string | null;
  has_password?: boolean | null;
  password_hash?: string | null;
}): CachedQr {
  return {
    id: row.id,
    destination: row.destination,
    status: row.status,
    content_type: row.content_type ?? row.content_kind ?? "url",
    has_password: row.has_password ?? !!row.password_hash,
  };
}

/** Hot-path read. Hard 800ms budget — a slow cache must never make a scan
 *  slower than just asking the DB. Any error/timeout reads as a miss. */
export async function qrCacheGet(shortId: string): Promise<CachedQr | null> {
  const c = conn();
  if (!c) return null;
  try {
    const res = await fetch(`${c.url}/get/${encodeURIComponent(key(shortId))}`, {
      headers: { Authorization: `Bearer ${c.token}` },
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { result: string | null };
    if (!body?.result) return null;
    const parsed = JSON.parse(body.result) as CachedQr;
    // Shape guard — never act on a malformed entry.
    if (!parsed?.id || typeof parsed.destination !== "string" || !parsed.status)
      return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Write-through. Runs off the hot path (inside after()/fire-and-forget),
 *  so a generous-but-bounded timeout; failures are silently dropped —
 *  the next scan's revalidate will retry. */
export async function qrCacheSet(shortId: string, qr: CachedQr): Promise<void> {
  const c = conn();
  if (!c) return;
  try {
    await fetch(`${c.url}/set/${encodeURIComponent(key(shortId))}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.token}` },
      body: JSON.stringify(qr),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    /* best-effort */
  }
}

/** Purge on delete (and on revalidate discovering the row is gone). */
export async function qrCacheDelete(shortId: string): Promise<void> {
  const c = conn();
  if (!c) return;
  try {
    await fetch(`${c.url}/del/${encodeURIComponent(key(shortId))}`, {
      headers: { Authorization: `Bearer ${c.token}` },
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    /* best-effort */
  }
}
