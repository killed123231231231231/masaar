/**
 * Escape one CSV cell. Cells that start with = + - @ (or a tab / carriage
 * return) are prefixed with an apostrophe so spreadsheet apps treat them as
 * text, not formulas: a scan's city, browser or a QR name is attacker-
 * controllable and would otherwise run as a formula when the owner opens
 * the export in Excel or Sheets.
 */
export function csvCell(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
