/**
 * Return `raw` only if it is a same-site path ("/dashboard", "/checkout/x?y"),
 * else `fallback`. Rejects protocol-relative and backslash tricks
 * ("//evil.com", "/\evil.com", "/%5Cevil.com"), control characters
 * ("/\t/evil.com") and anything that resolves to another origin.
 */
export function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== "string") return fallback;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  for (const s of [raw, decoded]) {
    if (!s.startsWith("/") || s.startsWith("//")) return fallback;
    if (s.includes("\\")) return fallback;
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(s)) return fallback;
  }
  try {
    const base = "https://x.invalid";
    const u = new URL(raw, base);
    if (u.origin !== base) return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}
