import { describe, expect, it } from "vitest";
import { bytesMatchImageMime } from "../image-sniff";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const html = new TextEncoder().encode("<html><script>alert(1)</script>");

describe("bytesMatchImageMime", () => {
  it("accepts real images", () => {
    expect(bytesMatchImageMime(png, "image/png")).toBe(true);
    expect(bytesMatchImageMime(jpg, "image/jpeg")).toBe(true);
    expect(bytesMatchImageMime(webp, "image/webp")).toBe(true);
  });
  it("rejects mismatched or disguised files", () => {
    expect(bytesMatchImageMime(html, "image/png")).toBe(false);
    expect(bytesMatchImageMime(png, "image/jpeg")).toBe(false);
    expect(bytesMatchImageMime(jpg, "image/svg+xml")).toBe(false);
  });
});
