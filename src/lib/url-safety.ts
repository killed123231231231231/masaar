import { parseHttpUrl } from "./url";

/**
 * Destination safety check for NEW or CHANGED dynamic-QR destinations.
 * Never run it against an unchanged destination of an existing (printed)
 * QR — Rule 0.
 *
 * Rejects: non-http(s), > 2048 chars, embedded credentials (user:pass@),
 * private / loopback / link-local hosts, *.local / *.localhost, and any
 * host on the BLOCKED_DOMAINS env list (comma separated; a listed domain
 * also blocks its subdomains).
 */
export const MAX_DESTINATION_LENGTH = 2048;

export type DestinationCheck = { ok: true; reason?: undefined } | { ok: false; reason: string };

const MSG_INVALID = "Enter a valid website address that starts with http:// or https://.";
const MSG_LONG = `The link must be ${MAX_DESTINATION_LENGTH} characters or fewer.`;
const MSG_CREDENTIALS = "Links with a username or password in them aren't allowed.";
const MSG_PRIVATE = "Links to private or local network addresses aren't allowed.";
const MSG_BLOCKED = "This link can't be used for a QR code. Contact support if you think this is a mistake.";

function blockedDomains(): string[] {
  return (process.env.BLOCKED_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^\*?\./, "").replace(/\.$/, ""))
    .filter(Boolean);
}

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(host: string): boolean {
  // URL.hostname keeps IPv6 literals in brackets.
  if (!host.startsWith("[")) return false;
  const h = host.slice(1, -1).toLowerCase();
  if (h === "::1" || h === "::") return true;
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true; // link-local fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true; // unique-local fc00::/7
  // IPv4-mapped (::ffff:a.b.c.d, normalised by URL to ::ffff:xxxx:xxxx)
  const mapped = h.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const hi = parseInt(mapped[1], 16);
    const lo = parseInt(mapped[2], 16);
    return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  return false;
}

export function checkDestination(raw: unknown): DestinationCheck {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, reason: MSG_INVALID };
  if (raw.length > MAX_DESTINATION_LENGTH) return { ok: false, reason: MSG_LONG };

  const url = parseHttpUrl(raw);
  if (!url) return { ok: false, reason: MSG_INVALID };
  if (url.username || url.password) return { ok: false, reason: MSG_CREDENTIALS };

  // URL lower-cases the host and normalises numeric IPv4 forms
  // (e.g. http://2130706433/ -> 127.0.0.1).
  const host = url.hostname.replace(/\.$/, "");
  if (!host) return { ok: false, reason: MSG_INVALID };

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    isPrivateIPv4(host) ||
    isPrivateIPv6(host)
  ) {
    return { ok: false, reason: MSG_PRIVATE };
  }

  for (const d of blockedDomains()) {
    if (host === d || host.endsWith(`.${d}`)) return { ok: false, reason: MSG_BLOCKED };
  }

  return { ok: true };
}
