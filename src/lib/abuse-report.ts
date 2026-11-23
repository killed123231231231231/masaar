// Shared by /contact (reads ?topic=abuse&qr=<shortId> from the "Report
// abuse" link on hosted scan pages) and /api/contact (validates it again
// server-side). The pattern is deliberately looser than isValidShortId()
// in shortid.ts: older printed QRs may use a different length or
// alphabet, and a report about one of them must still go through.
const REPORTABLE_SHORT_ID = /^[A-Za-z0-9_-]{1,32}$/;

export function isReportableShortId(value: unknown): value is string {
  return typeof value === "string" && REPORTABLE_SHORT_ID.test(value);
}

/** Room left for the reporter's own text once the QR line is prefixed. */
export const ABUSE_MESSAGE_MAX = 4800;

export function abuseReportMessage(shortId: string, message: string): string {
  return `[Abuse report] QR: ${shortId} (/r/${shortId})\n\n${message}`;
}
