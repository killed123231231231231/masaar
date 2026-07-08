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

/** lowbias32-style integer mix — shared by every distribution below so all
 *  of them are pure functions of their inputs (deterministic renders). */
function mix32(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic scattered color pick for dot `index`. The spread LOOKS
 *  random but is a pure function of the index — the preview, the download,
 *  and every reprint color the same dot the same way. A plain `index % n`
 *  would produce visible stripes. */
export function pickPaletteColor(palette: string[], index: number): string {
  return palette[mix32((index + 1) >>> 0) % palette.length];
}

/* ────────────── distribution options (migration 030) ──────────────
 * mode "cluster": color by the dot's grid NEIGHBORHOOD instead of its index,
 * so nearby dots share a color — the blobby "pizza toppings" regions look.
 * accent_color: a rare sprinkle color (herbs/olives) applied to ~accent_share
 * of the dots on top of the base palette. All position-hashed → deterministic.
 */

export interface PaletteOptions {
  mode: "scatter" | "cluster";
  accent_color: string | null;
  /** Fraction of dots that get the accent color (clamped 0.01–0.25). */
  accent_share: number;
  /** Cluster block size in modules (clamped 2–6): bigger = blobbier regions. */
  cluster_size: number;
}

export const ACCENT_SHARE_MIN = 0.01;
export const ACCENT_SHARE_MAX = 0.25;
export const CLUSTER_SIZE_MIN = 2;
export const CLUSTER_SIZE_MAX = 6;

/** Strict parse of the persisted/POSTed palette_options. Returns null when
 *  the value is malformed OR adds nothing over defaults (plain scatter, no
 *  accent) — so the column stays NULL unless a real option is set. */
export function cleanPaletteOptions(v: unknown): PaletteOptions | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const mode: PaletteOptions["mode"] = o.mode === "cluster" ? "cluster" : "scatter";
  const accent_color =
    typeof o.accent_color === "string" && HEX_COLOR.test(o.accent_color)
      ? o.accent_color
      : null;
  if (mode === "scatter" && !accent_color) return null;
  const share = typeof o.accent_share === "number" && Number.isFinite(o.accent_share)
    ? Math.min(ACCENT_SHARE_MAX, Math.max(ACCENT_SHARE_MIN, o.accent_share))
    : 0.06;
  const size = typeof o.cluster_size === "number" && Number.isFinite(o.cluster_size)
    ? Math.min(CLUSTER_SIZE_MAX, Math.max(CLUSTER_SIZE_MIN, Math.round(o.cluster_size)))
    : 3;
  return { mode, accent_color, accent_share: share, cluster_size: size };
}

/** Cluster-mode pick: every dot inside the same cluster_size×cluster_size
 *  block of the module grid gets the same palette color. */
export function pickClusterColor(
  palette: string[],
  col: number,
  row: number,
  clusterSize: number
): string {
  const cx = Math.floor(col / Math.max(1, clusterSize));
  const cy = Math.floor(row / Math.max(1, clusterSize));
  const h = mix32((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) >>> 0);
  return palette[h % palette.length];
}

/** Deterministic "is this dot an accent sprinkle?" — position-hashed so the
 *  same dot answers the same way in every render, at ~share frequency. */
export function isAccentDot(col: number, row: number, share: number): boolean {
  const h = mix32(
    (Math.imul(col + 1, 83492791) ^ Math.imul(row + 1, 2654435761)) >>> 0
  );
  return h % 10000 < Math.round(share * 10000);
}
