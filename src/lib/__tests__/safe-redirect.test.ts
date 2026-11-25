import { describe, expect, it } from "vitest";
import { safeInternalPath } from "../safe-redirect";

const F = "/dashboard";

describe("safeInternalPath", () => {
  it("keeps normal internal paths", () => {
    expect(safeInternalPath("/checkout/abc?x=1", F)).toBe("/checkout/abc?x=1");
    expect(safeInternalPath("/dashboard/qr-codes", F)).toBe("/dashboard/qr-codes");
  });
  it("rejects external and protocol-relative", () => {
    expect(safeInternalPath("https://evil.com", F)).toBe(F);
    expect(safeInternalPath("//evil.com", F)).toBe(F);
  });
  it("rejects backslash and encoded tricks", () => {
    expect(safeInternalPath(String.raw`/\evil.com`, F)).toBe(F);
    expect(safeInternalPath("/%5Cevil.com", F)).toBe(F);
    expect(safeInternalPath("/%2F/evil.com", F)).toBe(F);
  });
  it("rejects control characters", () => {
    expect(safeInternalPath("/\t/evil.com", F)).toBe(F);
    expect(safeInternalPath("/%09/evil.com", F)).toBe(F);
    expect(safeInternalPath("/%0A/evil.com", F)).toBe(F);
  });
  it("falls back on empty", () => {
    expect(safeInternalPath(undefined, F)).toBe(F);
    expect(safeInternalPath("", F)).toBe(F);
  });
});
