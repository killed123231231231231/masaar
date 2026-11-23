/**
 * Server-side client-IP hashing shared by every rate-limited route.
 *
 * The value MUST stay byte-for-byte identical to what the routes stored
 * before this helper existed (x-forwarded-for first hop, else x-real-ip,
 * else "0.0.0.0"; SHA-256 hex, first 16 chars) so existing rows in
 * anon_logo_uploads / file_uploads / contact_requests / feedback_responses
 * / qr_codes.creator_ip_hash keep counting against the same subject.
 *
 * Never accept an IP hash from the request body: callers compute it here
 * and pass it to the service-role RPCs (migration 031 revokes anon/
 * authenticated execute on them).
 */

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function sha256Hex16(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function ipHash(request: Request): Promise<string> {
  return sha256Hex16(clientIp(request));
}
