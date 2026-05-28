import { describe, it, expect } from "vitest";
import { generateShortId, isValidShortId, SHORT_ID_LENGTH } from "../shortid";

const ALLOWED = /^[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]+$/;

describe("generateShortId", () => {
  it("produces an id of the configured length from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const id = generateShortId();
      expect(id).toHaveLength(SHORT_ID_LENGTH);
      expect(id).toMatch(ALLOWED);
    }
  });

  it("never emits visually ambiguous characters (0 O 1 l I)", () => {
    const joined = Array.from({ length: 200 }, () => generateShortId()).join("");
    expect(joined).not.toMatch(/[01OlI]/);
  });
});

describe("isValidShortId", () => {
  it("accepts a freshly generated id (round-trip)", () => {
    expect(isValidShortId(generateShortId())).toBe(true);
  });

  it("accepts a hand-written 7-char id from the alphabet", () => {
    expect(isValidShortId("abcdefg")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isValidShortId("abcde")).toBe(false); // too short
    expect(isValidShortId("abcdefgh")).toBe(false); // too long
  });

  it("rejects ambiguous/out-of-alphabet characters", () => {
    expect(isValidShortId("abcde0f")).toBe(false); // contains 0
    expect(isValidShortId("abcdeIf")).toBe(false); // contains I
    expect(isValidShortId("abc-def")).toBe(false); // contains -
  });

  it("rejects non-string inputs", () => {
    expect(isValidShortId(1234567)).toBe(false);
    expect(isValidShortId(null)).toBe(false);
    expect(isValidShortId(undefined)).toBe(false);
    expect(isValidShortId(["abcdefg"])).toBe(false);
  });
});
