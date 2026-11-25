import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unlockCookieName, verifyUnlock } from "@/lib/unlock-token";

/**
 * Shared password gate for every page a scanner can open directly
 * (/s, /v, /loc, /f). /r already routes password QRs to /unlock, but these
 * pages are public URLs too, so each one must refuse to render a protected
 * QR without a valid unlock cookie. No password → no-op.
 * Server components only (reads cookies, may redirect).
 */
export async function requireUnlocked(
  shortId: string,
  passwordHash: string | null | undefined
): Promise<void> {
  if (!passwordHash) return;
  const jar = await cookies();
  const token = jar.get(unlockCookieName(shortId))?.value;
  if (await verifyUnlock(token, shortId, Date.now(), passwordHash)) return;
  redirect(`/unlock/${shortId}`);
}
