import { NextResponse } from "next/server";

/** Free-plan QR cap. Mirrors enforce_qr_quota() in migration 031. */
export const DEFAULT_QR_QUOTA = 25;

export const QUOTA_MESSAGE =
  "The free plan allows up to 25 QR codes per account. Delete an unused one to create another.";

export function isQuotaError(err: { message?: string } | null | undefined): boolean {
  return !!err?.message?.includes("qr_quota_exceeded");
}

export function quotaExceededResponse() {
  return NextResponse.json(
    { error: "quota_exceeded", message: QUOTA_MESSAGE },
    { status: 403 }
  );
}

/** Comma-separated ADMIN_EMAILS allow-list (server env), lower-cased. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
