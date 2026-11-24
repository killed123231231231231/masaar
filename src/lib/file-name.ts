/**
 * Turn a QR's name into a safe download file name (no extension), so a QR
 * called "Karak express website QR code" downloads as
 * "Karak express website QR code.png". Strips characters Windows/macOS
 * reject, collapses whitespace, caps the length, and falls back to
 * "vertexa-qr" when nothing usable is left.
 */
export function qrFileName(name: string | null | undefined, fallback = "vertexa-qr"): string {
  const cleaned = (name ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 80)
    .trim();
  return cleaned || fallback;
}
