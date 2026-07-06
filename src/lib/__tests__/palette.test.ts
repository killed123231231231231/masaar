import { describe, expect, it } from "vitest";
import {
  cleanHexArray,
  pickPaletteColor,
  HEX_COLOR,
  DOT_PALETTE_MIN,
  DOT_PALETTE_MAX,
  CORNER_COUNT,
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
