// Signed unlock tokens for password-protected QRs. HMAC-SHA256 keyed on the
// service-role key — a node-only secret never shipped to the client or the
// edge. The cookie masaar_unlock_<shortId> proves a scanner entered the
// correct password; /unlock (node) verifies it before redirecting onward.
// (Only node routes/pages call these — the service-role key is available
// there but not on the edge, which is why password QRs gate at /unlock.)

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing (unlock signing).");
  return s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

export const UNLOCK_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const unlockCookieName = (shortId: string) => `masaar_unlock_${shortId}`;

// Binds a token to the QR's CURRENT password: the HMAC covers a fingerprint
// of password_hash, so changing the password invalidates every cookie issued
// for the old one (it used to stay valid for up to 24h). The fingerprint is
// never put in the cookie itself.
async function fingerprint(passwordHash: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(passwordHash));
  return Buffer.from(new Uint8Array(d)).toString("base64url").slice(0, 16);
}

export async function signUnlock(
  shortId: string,
  now: number,
  passwordHash: string
): Promise<string> {
  const exp = now + UNLOCK_TTL_MS;
  const body = `${shortId}.${exp}`;
  return `${body}.${await hmac(`${body}.${await fingerprint(passwordHash)}`)}`;
}

export async function verifyUnlock(
  token: string | undefined,
  shortId: string,
  now: number,
  passwordHash: string
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sid, expStr, sig] = parts;
  if (sid !== shortId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return false;
  const expected = await hmac(`${sid}.${expStr}.${await fingerprint(passwordHash)}`);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
