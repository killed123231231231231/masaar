import { describe, it, expect } from "vitest";
import {
  adminEmailSet,
  bucketByRiyadhDay,
  destinationHost,
  formatRiyadhDateTime,
  isAdminEmail,
  isBanned,
  isSameOrigin,
  isUuid,
  lastRiyadhDays,
  riyadhDay,
} from "../admin";

describe("isAdminEmail", () => {
  it("is false for everyone when the allow-list is empty or unset", () => {
    expect(isAdminEmail("owner@example.com", undefined)).toBe(false);
    expect(isAdminEmail("owner@example.com", "")).toBe(false);
    expect(isAdminEmail("owner@example.com", " , ,")).toBe(false);
  });

  it("matches case-insensitively after trimming", () => {
    const raw = " Owner@Example.com , second@example.com ";
    expect(isAdminEmail("owner@example.com", raw)).toBe(true);
    expect(isAdminEmail("OWNER@EXAMPLE.COM", raw)).toBe(true);
    expect(isAdminEmail("  second@example.com ", raw)).toBe(true);
  });

  it("rejects emails not on the list, partial matches and empty input", () => {
    const raw = "owner@example.com";
    expect(isAdminEmail("other@example.com", raw)).toBe(false);
    expect(isAdminEmail("owner@example.co", raw)).toBe(false);
    expect(isAdminEmail("xowner@example.com", raw)).toBe(false);
    expect(isAdminEmail("", raw)).toBe(false);
    expect(isAdminEmail(null, raw)).toBe(false);
    expect(isAdminEmail(undefined, raw)).toBe(false);
  });

  it("parses the list into a lowercased set", () => {
    expect([...adminEmailSet("A@x.com,b@X.com,,a@x.com")]).toEqual([
      "a@x.com",
      "b@x.com",
    ]);
  });
});

describe("isUuid", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(isUuid("3f2b6c1e-8a4d-4c2b-9e1f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("3f2b6c1e-8a4d-4c2b-9e1f-0a1b2c3d4e5f' or 1=1")).toBe(false);
    expect(isUuid(42)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe("isSameOrigin", () => {
  it("requires the Origin host to equal the request host", () => {
    expect(isSameOrigin("https://quickqrcode.live", "quickqrcode.live")).toBe(true);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(isSameOrigin("https://evil.example", "quickqrcode.live")).toBe(false);
    expect(isSameOrigin("https://quickqrcode.live.evil.example", "quickqrcode.live")).toBe(false);
  });

  it("rejects a missing or malformed Origin", () => {
    expect(isSameOrigin(null, "quickqrcode.live")).toBe(false);
    expect(isSameOrigin("null", "quickqrcode.live")).toBe(false);
    expect(isSameOrigin("https://quickqrcode.live", null)).toBe(false);
  });
});

describe("isBanned", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  it("is true only while banned_until is in the future", () => {
    expect(isBanned("2126-11-23T12:00:00Z", now)).toBe(true);
    expect(isBanned("2026-11-22T12:00:00Z", now)).toBe(false);
    expect(isBanned(null, now)).toBe(false);
    expect(isBanned("garbage", now)).toBe(false);
  });
});

describe("Riyadh day helpers", () => {
  it("buckets by the Riyadh calendar day, not UTC", () => {
    // 22:30 UTC on 22 Nov is 1:30 AM on 23 Nov in Riyadh (UTC+3).
    expect(riyadhDay("2026-11-22T22:30:00Z")).toBe("2026-11-23");
    expect(riyadhDay("2026-11-22T20:30:00Z")).toBe("2026-11-22");
  });

  it("lists the last n days oldest first, ending today", () => {
    const now = new Date("2026-11-23T09:00:00Z");
    expect(lastRiyadhDays(3, now)).toEqual(["2026-11-21", "2026-11-22", "2026-11-23"]);
  });

  it("zero-fills days and ignores timestamps outside the window", () => {
    const days = ["2026-11-22", "2026-11-23"];
    const out = bucketByRiyadhDay(
      ["2026-11-22T22:30:00Z", "2026-11-23T05:00:00Z", "2026-11-01T05:00:00Z"],
      days
    );
    expect(out).toEqual([
      { day: "2026-11-22", count: 0 },
      { day: "2026-11-23", count: 2 },
    ]);
  });

  it("formats in Riyadh time with AM/PM", () => {
    expect(formatRiyadhDateTime("2026-11-23T19:27:00Z")).toBe("23 Nov 2026, 10:27 PM");
    expect(formatRiyadhDateTime(null)).toBe("-");
  });
});

describe("destinationHost", () => {
  it("returns only the host of http(s) destinations", () => {
    expect(destinationHost("https://example.com/path?token=secret")).toBe("example.com");
    expect(destinationHost("mailto:a@b.com")).toBe("-");
    expect(destinationHost("BEGIN:VCARD")).toBe("-");
    expect(destinationHost("")).toBe("-");
  });
});
