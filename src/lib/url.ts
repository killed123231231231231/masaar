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
