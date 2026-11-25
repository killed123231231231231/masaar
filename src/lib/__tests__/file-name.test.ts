import { describe, expect, it } from "vitest";
import { qrFileName } from "../file-name";

describe("qrFileName", () => {
  it("keeps the QR name as typed", () => {
    expect(qrFileName("Karak express website QR code")).toBe("Karak express website QR code");
  });
  it("keeps Arabic and other scripts", () => {
    expect(qrFileName("كرك اكسبريس")).toBe("كرك اكسبريس");
  });
  it("strips characters file systems reject", () => {
    expect(qrFileName('Menu: "Summer" / v2?')).toBe("Menu Summer v2");
  });
  it("strips backslashes", () => {
    expect(qrFileName("a\\b")).toBe("a b");
  });
  it("drops trailing dots and spaces", () => {
    expect(qrFileName("Promo...  ")).toBe("Promo");
  });
  it("falls back when empty", () => {
    expect(qrFileName("")).toBe("vertexa-qr");
    expect(qrFileName(null)).toBe("vertexa-qr");
    expect(qrFileName(" :*? ")).toBe("vertexa-qr");
  });
  it("caps very long names", () => {
    expect(qrFileName("a".repeat(200)).length).toBe(80);
  });
});
