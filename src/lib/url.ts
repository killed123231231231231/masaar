/**
 * Parse a value as an http/https URL. Returns the parsed URL, or null if
 * it is not a string or not an http(s) URL.
 *
 * Used to gate the dynamic-QR redirect (no javascript:/data:/mailto: or
 * malformed targets reaching NextResponse.redirect, which would 500) and
 * to reject invalid destinations when a dynamic QR is created.
 *
 * Intentionally dependency-free so it is safe to import in the edge route.
 */
/**
 * Normalize a user-typed URL for the "url" content kind: if they typed
 * a bare domain (`karakexpress.com`, `karakexpress.com/menu`) with no
 * scheme, prepend `https://`. Anything that already has a `scheme://`
 * prefix is left untouched. Server-side parseHttpUrl still validates
 * the result, so a malformed input just fails there as before.
 */
export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return v;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function parseHttpUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  return url.protocol === "http:" || url.protocol === "https:" ? url : null;
}
