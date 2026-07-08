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
 * mode "organic": cluster with hash-jittered block edges → irregular,
 * hand-placed-looking blobs instead of a visible square grid.
 * weights: per-palette-color share (e.g. 52/38/6/4) instead of equal odds.
 * accent_color: a rare sprinkle color (herbs/olives) applied to ~accent_share
 * of the dots on top of the base palette; accent_style "mini" clumps the
 * sprinkles into tiny 2×2-ish clusters. All position-hashed → deterministic.
 */

export interface PaletteOptions {
  mode: "scatter" | "cluster" | "organic";
  /** Per-color weights aligned to the dot_palette array (normalized before
   *  use). null → equal weights. Ignored unless it matches palette length. */
  weights: number[] | null;
  accent_color: string | null;
  /** Fraction of dots that get the accent color (clamped 0.01–0.25). */
  accent_share: number;
  /** "dots" = independent rare dots; "mini" = tiny 2×2-ish clumps. */
  accent_style: "dots" | "mini";
  /** Cluster block size in modules (clamped 2–6): bigger = blobbier regions. */
  cluster_size: number;
}

export const ACCENT_SHARE_MIN = 0.01;
export const ACCENT_SHARE_MAX = 0.25;
export const CLUSTER_SIZE_MIN = 2;
export const CLUSTER_SIZE_MAX = 6;

/** Strict parse of the persisted/POSTed palette_options. Returns null when
 *  the value is malformed OR adds nothing over defaults (plain scatter, no
 *  accent, no weights) — so the column stays NULL unless a real option is
 *  set. Unknown keys are dropped. */
export function cleanPaletteOptions(v: unknown): PaletteOptions | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const mode: PaletteOptions["mode"] =
    o.mode === "cluster" ? "cluster" : o.mode === "organic" ? "organic" : "scatter";
  const accent_color =
    typeof o.accent_color === "string" && HEX_COLOR.test(o.accent_color)
      ? o.accent_color
      : null;
  // Weights: finite positives only, capped at palette max — anything else
  // is treated as "no weights" (equal odds), never partially accepted.
  let weights: number[] | null = null;
  if (
    Array.isArray(o.weights) &&
    o.weights.length >= DOT_PALETTE_MIN &&
    o.weights.length <= DOT_PALETTE_MAX &&
    o.weights.every((w) => typeof w === "number" && Number.isFinite(w) && w > 0)
  ) {
    weights = o.weights as number[];
  }
  if (mode === "scatter" && !accent_color && !weights) return null;
  const share = typeof o.accent_share === "number" && Number.isFinite(o.accent_share)
    ? Math.min(ACCENT_SHARE_MAX, Math.max(ACCENT_SHARE_MIN, o.accent_share))
    : 0.06;
  const size = typeof o.cluster_size === "number" && Number.isFinite(o.cluster_size)
    ? Math.min(CLUSTER_SIZE_MAX, Math.max(CLUSTER_SIZE_MIN, Math.round(o.cluster_size)))
    : 3;
  const accent_style: PaletteOptions["accent_style"] =
    o.accent_style === "mini" ? "mini" : "dots";
  return { mode, weights, accent_color, accent_share: share, accent_style, cluster_size: size };
}

/** Weighted pick from a 32-bit hash: walk the cumulative weight table. With
 *  null weights every color is equally likely (matches the legacy modulo). */
function pickWeighted(palette: string[], weights: number[] | null, h: number): string {
  if (!weights || weights.length !== palette.length) {
    return palette[h % palette.length];
  }
  const total = weights.reduce((s, w) => s + w, 0);
  let u = ((h % 100000) / 100000) * total;
  for (let i = 0; i < palette.length; i++) {
    u -= weights[i];
    if (u < 0) return palette[i];
  }
  return palette[palette.length - 1];
}

/** Cluster-mode pick: every dot inside the same cluster_size×cluster_size
 *  block of the module grid gets the same palette color. */
export function pickClusterColor(
  palette: string[],
  col: number,
  row: number,
  clusterSize: number,
  weights: number[] | null = null
): string {
  const cx = Math.floor(col / Math.max(1, clusterSize));
  const cy = Math.floor(row / Math.max(1, clusterSize));
  const h = mix32((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) >>> 0);
  return pickWeighted(palette, weights, h);
}

/** Organic-mode pick: like cluster, but each dot's position is jittered by a
 *  ±1-module position hash BEFORE the block division, so block borders go
 *  ragged and the regions read as hand-placed blobs, not a square grid. */
export function pickOrganicColor(
  palette: string[],
  col: number,
  row: number,
  clusterSize: number,
  weights: number[] | null = null
): string {
  const jx = (mix32((Math.imul(col + 7, 92837111) ^ Math.imul(row + 3, 689287499)) >>> 0) % 3) - 1;
  const jy = (mix32((Math.imul(col + 11, 283923481) ^ Math.imul(row + 5, 41543801)) >>> 0) % 3) - 1;
  return pickClusterColor(palette, col + jx, row + jy, clusterSize, weights);
}

/** Deterministic "is this dot an accent sprinkle?" — position-hashed so the
 *  same dot answers the same way in every render, at ~share frequency.
 *  style "mini" hashes the dot's 2×2 block instead of the dot itself, so
 *  accents appear as tiny clumps rather than isolated singles. */
export function isAccentDot(
  col: number,
  row: number,
  share: number,
  style: "dots" | "mini" = "dots"
): boolean {
  const c = style === "mini" ? Math.floor(col / 2) : col;
  const r = style === "mini" ? Math.floor(row / 2) : row;
  const h = mix32(
    (Math.imul(c + 1, 83492791) ^ Math.imul(r + 1, 2654435761)) >>> 0
  );
  return h % 10000 < Math.round(share * 10000);
}

/** Single entry point the renderer uses. options=null reproduces the legacy
 *  per-index scatter EXACTLY (existing multi-color QRs render unchanged). */
export function resolveDotColor(
  palette: string[],
  options: PaletteOptions | null,
  col: number | null,
  row: number | null,
  index: number
): string {
  if (!options) return pickPaletteColor(palette, index);
  if (col !== null && row !== null) {
    if (options.accent_color && isAccentDot(col, row, options.accent_share, options.accent_style)) {
      return options.accent_color;
    }
    if (options.mode === "cluster") {
      return pickClusterColor(palette, col, row, options.cluster_size, options.weights);
    }
    if (options.mode === "organic") {
      return pickOrganicColor(palette, col, row, options.cluster_size, options.weights);
    }
  }
  // Scatter (or position unavailable): index-hashed, weighted when set.
  return pickWeighted(palette, options.weights, mix32((index + 1) >>> 0));
}
