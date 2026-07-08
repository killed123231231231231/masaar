import { describe, expect, it } from "vitest";
import {
  cleanHexArray,
  cleanPaletteOptions,
  pickPaletteColor,
  pickClusterColor,
  pickOrganicColor,
  isAccentDot,
  resolveDotColor,
  HEX_COLOR,
  DOT_PALETTE_MIN,
  DOT_PALETTE_MAX,
  CORNER_COUNT,
  type PaletteOptions,
} from "../palette";

describe("cleanHexArray", () => {
  it("accepts a valid palette within bounds", () => {
    expect(cleanHexArray(["#FFC107", "#1E3A5F"], 2, 4)).toEqual([
      "#FFC107",
      "#1E3A5F",
    ]);
    expect(
      cleanHexArray(["#000000", "#ffffff", "#A8291d"], 3, 3)
    ).toEqual(["#000000", "#ffffff", "#A8291d"]);
  });

  it("rejects wrong lengths", () => {
    expect(cleanHexArray(["#FFC107"], 2, 4)).toBeNull();
    expect(
      cleanHexArray(["#111111", "#222222", "#333333", "#444444", "#555555"], 2, 4)
    ).toBeNull();
    expect(cleanHexArray(["#111111", "#222222"], 3, 3)).toBeNull();
  });

  it("rejects any malformed entry (whole array, not partial)", () => {
    expect(cleanHexArray(["#FFC107", "red"], 2, 4)).toBeNull();
    expect(cleanHexArray(["#FFC107", "#12345"], 2, 4)).toBeNull();
    expect(cleanHexArray(["#FFC107", "#1234567"], 2, 4)).toBeNull();
    expect(cleanHexArray(["#FFC107", 42], 2, 4)).toBeNull();
    // Reject javascript:-style smuggling / whitespace
    expect(cleanHexArray(["#FFC107", " #1E3A5F"], 2, 4)).toBeNull();
  });

  it("rejects non-arrays", () => {
    expect(cleanHexArray("#FFC107", 2, 4)).toBeNull();
    expect(cleanHexArray(null, 2, 4)).toBeNull();
    expect(cleanHexArray(undefined, 2, 4)).toBeNull();
    expect(cleanHexArray({ 0: "#FFC107" }, 2, 4)).toBeNull();
  });

  it("bounds constants match the product contract", () => {
    expect(DOT_PALETTE_MIN).toBe(2);
    expect(DOT_PALETTE_MAX).toBe(4);
    expect(CORNER_COUNT).toBe(3);
  });
});

describe("pickPaletteColor", () => {
  const palette = ["#FFC107", "#1E3A5F", "#A8291D"];

  it("is deterministic — same index, same color, every call", () => {
    for (let i = 0; i < 200; i++) {
      expect(pickPaletteColor(palette, i)).toBe(pickPaletteColor(palette, i));
    }
  });

  it("only ever returns palette members", () => {
    for (let i = 0; i < 500; i++) {
      expect(palette).toContain(pickPaletteColor(palette, i));
    }
  });

  it("uses every palette color across a real QR's worth of dots", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(pickPaletteColor(palette, i));
    expect(seen.size).toBe(palette.length);
  });

  it("scatters rather than stripes (2-color palette is not strictly alternating)", () => {
    const two = ["#000000", "#FFFFFF"];
    let adjacentSame = 0;
    for (let i = 0; i < 99; i++) {
      if (pickPaletteColor(two, i) === pickPaletteColor(two, i + 1)) {
        adjacentSame++;
      }
    }
    // A plain index % 2 would give 0 adjacent-same pairs; a good hash gives
    // roughly half. Assert it's clearly not striped.
    expect(adjacentSame).toBeGreaterThan(20);
  });
});

describe("HEX_COLOR", () => {
  it("matches #RRGGBB only", () => {
    expect(HEX_COLOR.test("#0F5B55")).toBe(true);
    expect(HEX_COLOR.test("#0f5b55")).toBe(true);
    expect(HEX_COLOR.test("0F5B55")).toBe(false);
    expect(HEX_COLOR.test("#0F5")).toBe(false);
    expect(HEX_COLOR.test("#0F5B55AA")).toBe(false);
  });
});

describe("cleanPaletteOptions", () => {
  it("returns null for defaults-only (plain scatter, no accent)", () => {
    expect(cleanPaletteOptions(null)).toBeNull();
    expect(cleanPaletteOptions(undefined)).toBeNull();
    expect(cleanPaletteOptions({})).toBeNull();
    expect(cleanPaletteOptions({ mode: "scatter" })).toBeNull();
    expect(cleanPaletteOptions([])).toBeNull();
    expect(cleanPaletteOptions("cluster")).toBeNull();
  });

  it("accepts cluster mode with defaults filled in", () => {
    expect(cleanPaletteOptions({ mode: "cluster" })).toEqual({
      mode: "cluster",
      weights: null,
      accent_color: null,
      accent_share: 0.06,
      accent_style: "dots",
      cluster_size: 3,
    });
  });

  it("accepts an accent with clamped share/size", () => {
    expect(
      cleanPaletteOptions({
        accent_color: "#5B8C2A",
        accent_share: 0.9,
        cluster_size: 99,
        accent_style: "mini",
      })
    ).toEqual({
      mode: "scatter",
      weights: null,
      accent_color: "#5B8C2A",
      accent_share: 0.25,
      accent_style: "mini",
      cluster_size: 6,
    });
  });

  it("drops malformed accent colors (whole option unaffected)", () => {
    expect(cleanPaletteOptions({ accent_color: "green" })).toBeNull();
    expect(
      cleanPaletteOptions({ mode: "cluster", accent_color: "green" })
    ).toEqual({
      mode: "cluster",
      weights: null,
      accent_color: null,
      accent_share: 0.06,
      accent_style: "dots",
      cluster_size: 3,
    });
  });

  it("accepts organic mode and valid weights; scatter+weights is meaningful", () => {
    expect(cleanPaletteOptions({ mode: "organic" })?.mode).toBe("organic");
    const w = cleanPaletteOptions({ weights: [52, 38, 6, 4] });
    expect(w).not.toBeNull();
    expect(w?.weights).toEqual([52, 38, 6, 4]);
  });

  it("rejects malformed weights (never partially accepted)", () => {
    expect(cleanPaletteOptions({ weights: [52, -1] })).toBeNull();
    expect(cleanPaletteOptions({ weights: [52] })).toBeNull(); // under min
    expect(cleanPaletteOptions({ weights: [1, 2, 3, 4, 5] })).toBeNull(); // over max
    expect(cleanPaletteOptions({ weights: [10, "x"] })).toBeNull();
    expect(cleanPaletteOptions({ mode: "cluster", weights: [0, 5] })?.weights).toBeNull();
  });
});

describe("weighted distribution + organic + mini accents", () => {
  const palette = ["#A81705", "#CE8618", "#36A317", "#6F3C22"];
  const weights = [52, 38, 6, 4];
  const opts = (over: Partial<PaletteOptions>): PaletteOptions => ({
    mode: "scatter",
    weights: null,
    accent_color: null,
    accent_share: 0.06,
    accent_style: "dots",
    cluster_size: 3,
    ...over,
  });

  it("resolveDotColor with null options matches legacy per-index scatter exactly", () => {
    for (let i = 0; i < 300; i++) {
      expect(resolveDotColor(palette, null, i % 30, Math.floor(i / 30), i)).toBe(
        pickPaletteColor(palette, i)
      );
    }
  });

  it("weights steer frequencies near their shares (scatter mode)", () => {
    const o = opts({ weights });
    const counts = new Map<string, number>();
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const c = resolveDotColor(palette, o, null, null, i);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    expect((counts.get("#A81705") ?? 0) / N).toBeGreaterThan(0.45);
    expect((counts.get("#A81705") ?? 0) / N).toBeLessThan(0.6);
    expect((counts.get("#36A317") ?? 0) / N).toBeGreaterThan(0.03);
    expect((counts.get("#36A317") ?? 0) / N).toBeLessThan(0.1);
    expect((counts.get("#6F3C22") ?? 0) / N).toBeGreaterThan(0.02);
    expect((counts.get("#6F3C22") ?? 0) / N).toBeLessThan(0.08);
  });

  it("organic mode is deterministic and differs from square clusters somewhere", () => {
    let differs = false;
    for (let col = 0; col < 30; col++) {
      for (let row = 0; row < 30; row++) {
        const a = pickOrganicColor(palette, col, row, 5);
        expect(pickOrganicColor(palette, col, row, 5)).toBe(a); // deterministic
        if (a !== pickClusterColor(palette, col, row, 5)) differs = true;
      }
    }
    expect(differs).toBe(true); // ragged edges actually happen
  });

  it("mini accent style clumps: a 2×2 block answers uniformly", () => {
    for (let bc = 0; bc < 15; bc++) {
      for (let br = 0; br < 15; br++) {
        const base = isAccentDot(bc * 2, br * 2, 0.1, "mini");
        expect(isAccentDot(bc * 2 + 1, br * 2, 0.1, "mini")).toBe(base);
        expect(isAccentDot(bc * 2, br * 2 + 1, 0.1, "mini")).toBe(base);
        expect(isAccentDot(bc * 2 + 1, br * 2 + 1, 0.1, "mini")).toBe(base);
      }
    }
  });
});

describe("pickClusterColor", () => {
  const palette = ["#A8291D", "#C9862B", "#D4831F"];

  it("is deterministic per position", () => {
    for (let col = 0; col < 20; col++) {
      for (let row = 0; row < 20; row++) {
        expect(pickClusterColor(palette, col, row, 3)).toBe(
          pickClusterColor(palette, col, row, 3)
        );
      }
    }
  });

  it("gives every dot inside one cluster block the same color", () => {
    // Block (0..2, 0..2) with cluster_size 3 must be uniform.
    const base = pickClusterColor(palette, 0, 0, 3);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        expect(pickClusterColor(palette, col, row, 3)).toBe(base);
      }
    }
  });

  it("uses multiple colors across many blocks (not one giant region)", () => {
    const seen = new Set<string>();
    for (let bx = 0; bx < 10; bx++) {
      for (let by = 0; by < 10; by++) {
        seen.add(pickClusterColor(palette, bx * 3, by * 3, 3));
      }
    }
    expect(seen.size).toBe(palette.length);
  });
});

describe("isAccentDot", () => {
  it("is deterministic per position", () => {
    for (let col = 0; col < 30; col++) {
      for (let row = 0; row < 30; row++) {
        expect(isAccentDot(col, row, 0.06)).toBe(isAccentDot(col, row, 0.06));
      }
    }
  });

  it("hits roughly the requested share across a grid", () => {
    let hits = 0;
    const N = 100;
    for (let col = 0; col < N; col++) {
      for (let row = 0; row < N; row++) {
        if (isAccentDot(col, row, 0.06)) hits++;
      }
    }
    const share = hits / (N * N);
    expect(share).toBeGreaterThan(0.03);
    expect(share).toBeLessThan(0.09);
  });

  it("share 0 never marks, share ~max marks noticeably more", () => {
    let zero = 0;
    let heavy = 0;
    for (let col = 0; col < 50; col++) {
      for (let row = 0; row < 50; row++) {
        if (isAccentDot(col, row, 0)) zero++;
        if (isAccentDot(col, row, 0.25)) heavy++;
      }
    }
    expect(zero).toBe(0);
    expect(heavy).toBeGreaterThan(400); // ≥ ~16% of 2500
  });
});
