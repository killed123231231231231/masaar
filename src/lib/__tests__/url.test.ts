import { describe, it, expect } from "vitest";
import { normalizeUrl, parseHttpUrl } from "../url";

describe("normalizeUrl", () => {
  it("prepends https:// to a bare domain", () => {
    expect(normalizeUrl("karakexpress.com")).toBe("https://karakexpress.com");
    expect(normalizeUrl("karakexpress.com/menu")).toBe(
      "https://karakexpress.com/menu"
    );
  });

  it("leaves an existing scheme untouched", () => {
    expect(normalizeUrl("http://x.com")).toBe("http://x.com");
    expect(normalizeUrl("https://x.com")).toBe("https://x.com");
    expect(normalizeUrl("ftp://x.com")).toBe("ftp://x.com");
  });

  it("trims surrounding whitespace before normalizing", () => {
    expect(normalizeUrl("  spaced.com  ")).toBe("https://spaced.com");
  });

  it("returns empty input unchanged", () => {
    expect(normalizeUrl("")).toBe("");
    expect(normalizeUrl("   ")).toBe("");
  });
});

describe("parseHttpUrl", () => {
  it("accepts http and https URLs", () => {
    expect(parseHttpUrl("https://example.com")?.protocol).toBe("https:");
    expect(parseHttpUrl("http://example.com/path?q=1")?.protocol).toBe("http:");
  });

  it("trims whitespace before parsing", () => {
    expect(parseHttpUrl("  https://example.com  ")?.host).toBe("example.com");
  });

  it("rejects dangerous and non-http schemes (the redirect/SSRF gate)", () => {
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("data:text/html,<script>")).toBeNull();
    expect(parseHttpUrl("mailto:a@b.com")).toBeNull();
    expect(parseHttpUrl("ftp://host/file")).toBeNull();
    expect(parseHttpUrl("file:///etc/passwd")).toBeNull();
  });

  it("rejects malformed strings and non-string inputs", () => {
    expect(parseHttpUrl("not a url")).toBeNull();
    expect(parseHttpUrl("https://")).toBeNull();
    expect(parseHttpUrl(123)).toBeNull();
    expect(parseHttpUrl(null)).toBeNull();
    expect(parseHttpUrl(undefined)).toBeNull();
    expect(parseHttpUrl({})).toBeNull();
  });
});
