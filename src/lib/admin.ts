// Owner admin panel helpers.
//
// Access is an allow-list of emails in the server-only env var ADMIN_EMAILS
// (comma-separated). Empty or unset means nobody is an admin, so a fresh
// deployment never exposes /admin by accident. Every admin page and route
// calls requireAdmin() on the server; the UI never decides access.
//
// The pure helpers below (allow-list parsing, same-origin check, UUID check,
// Riyadh-time formatting and day bucketing) carry no imports so they can be
// unit-tested without Next.js or Supabase.

import type { User } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Parse ADMIN_EMAILS into a lowercased, trimmed set of addresses. */
export function adminEmailSet(raw: string | undefined = process.env.ADMIN_EMAILS): Set<string> {
  const out = new Set<string>();
  if (!raw) return out;
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (email) out.add(email);
  }
  return out;
}

/** True only when the email is on the ADMIN_EMAILS allow-list. */
export function isAdminEmail(
  email: string | null | undefined,
  raw: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return adminEmailSet(raw).has(normalized);
}

/**
 * Server-only: the signed-in user if they are an admin, otherwise null.
 * Uses the cookie-bound Supabase client so the session is verified by
 * Supabase Auth (getUser), not just decoded from the cookie.
 */
export async function requireAdmin(): Promise<User | null> {
  if (adminEmailSet().size === 0) return null;
  // Imported lazily so this module stays importable from unit tests.
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * CSRF guard for the admin POST routes: the Origin header must be present
 * and its host must equal the host the request was sent to.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return u.host.toLowerCase() === host.trim().toLowerCase();
  } catch {
    return false;
  }
}

/** True when a Supabase Auth banned_until value is still in the future. */
export function isBanned(bannedUntil: string | null | undefined, now: Date = new Date()): boolean {
  if (!bannedUntil) return false;
  const t = Date.parse(bannedUntil);
  return Number.isFinite(t) && t > now.getTime();
}

const RIYADH = "Asia/Riyadh";

/** Riyadh calendar day (YYYY-MM-DD) for an ISO timestamp. */
export function riyadhDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: RIYADH });
}

/**
 * The last `n` Riyadh calendar days, oldest first, ending with today.
 * Riyadh has no daylight saving, so stepping back 24 hours is exact.
 */
export function lastRiyadhDays(n: number, now: Date = new Date()): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(riyadhDay(new Date(now.getTime() - i * 86_400_000)));
  }
  return days;
}

/** Count timestamps per Riyadh day over the given day keys (zero-filled). */
export function bucketByRiyadhDay(
  timestamps: string[],
  days: string[]
): { day: string; count: number }[] {
  const counts = new Map<string, number>(days.map((d) => [d, 0]));
  for (const ts of timestamps) {
    const key = riyadhDay(ts);
    const cur = counts.get(key);
    if (cur !== undefined) counts.set(key, cur + 1);
  }
  return days.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

/** "23 Nov 2026, 10:27 PM" in Riyadh time. */
export function formatRiyadhDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-GB", {
    timeZone: RIYADH,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    timeZone: RIYADH,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date}, ${time}`;
}

/** Host part of a destination URL only, so the panel never shows full links. */
export function destinationHost(destination: string | null | undefined): string {
  if (!destination) return "-";
  try {
    const u = new URL(destination);
    if (u.protocol === "http:" || u.protocol === "https:") return u.host || "-";
    return "-";
  } catch {
    return "-";
  }
}
