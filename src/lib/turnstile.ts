/**
 * Cloudflare Turnstile server-side verification (free bot protection).
 * SERVER ONLY.
 *
 * Fully env-gated: while TURNSTILE_SECRET_KEY is unset this returns true,
 * so nothing changes until the owner adds the keys. Once the secret is set,
 * a missing/invalid token or an unreachable Cloudflare fails closed.
 */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileServerEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip && ip !== "0.0.0.0") form.set("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return data?.success === true;
  } catch (e) {
    console.warn(`[turnstile] siteverify failed: ${String(e)}`);
    return false;
  }
}
