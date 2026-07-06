// Multi-color dot palette + per-corner color helpers. Pure functions —
// shared by the client renderer (lib/qr) and the API validators, and
// unit-tested in __tests__/palette.test.ts.

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const DOT_PALETTE_MIN = 2;
export const DOT_PALETTE_MAX = 4;
export const CORNER_COUNT = 3; // [top-left, top-right, bottom-left]

/** Strict validator: returns the array only if EVERY entry is a #RRGGBB hex
 *  and the length is within [min, max]; anything else → null (field ignored
 *  by the API rather than partially accepted). */
export function cleanHexArray(
  v: unknown,
  min: number,
  max: number
): string[] | null {
  if (!Array.isArray(v) || v.length < min || v.length > max) return null;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string" || !HEX_COLOR.test(item)) return null;
    out.push(item);
  }
  return out;
}

/** Deterministic scattered color pick for dot `index`. Integer-hash mixing
 *  (lowbias32-style) so the spread LOOKS random but is a pure function of
 *  the index — the preview, the download, and every reprint color the same
 *  dot the same way. A plain `index % n` would produce visible stripes. */
export function pickPaletteColor(palette: string[], index: number): string {
  let h = (index + 1) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return palette[h % palette.length];
}
