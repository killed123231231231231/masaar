import { describe, it, expect } from "vitest";
import { isRedirectKind, qrTarget } from "../qr-target";

describe("isRedirectKind", () => {
  it("covers every dynamic kind that qrTarget redirects", () => {
    for (const ck of ["url", "whatsapp", "app_link", "email", "phone"]) {
      expect(isRedirectKind("dynamic", ck)).toBe(true);
      expect(qrTarget("abc1234", ck, "https://example.com/")).toBe(
        "https://example.com/"
      );
    }
  });

  it("excludes hosted kinds and static QRs", () => {
    for (const ck of ["pdf", "image", "video", "social", "location", "feedback"]) {
      expect(isRedirectKind("dynamic", ck)).toBe(false);
      expect(qrTarget("abc1234", ck, "https://example.com/")?.startsWith("/")).toBe(true);
    }
    expect(isRedirectKind("static", "url")).toBe(false);
  });
});
