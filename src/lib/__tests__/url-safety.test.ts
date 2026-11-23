import { afterEach, describe, expect, it } from "vitest";
import { checkDestination, MAX_DESTINATION_LENGTH } from "../url-safety";

const ORIGINAL_BLOCKED = process.env.BLOCKED_DOMAINS;

afterEach(() => {
  if (ORIGINAL_BLOCKED === undefined) delete process.env.BLOCKED_DOMAINS;
  else process.env.BLOCKED_DOMAINS = ORIGINAL_BLOCKED;
});

describe("checkDestination", () => {
  it("accepts ordinary http(s) URLs", () => {
    expect(checkDestination("https://karakexpress.com/menu").ok).toBe(true);
    expect(checkDestination("http://example.com").ok).toBe(true);
    expect(checkDestination("https://sub.example.co.uk/a?b=c#d").ok).toBe(true);
    expect(checkDestination("https://8.8.8.8/").ok).toBe(true);
  });

  it("rejects non-strings, empty and non-http(s) values", () => {
    expect(checkDestination(undefined).ok).toBe(false);
    expect(checkDestination(42).ok).toBe(false);
    expect(checkDestination("").ok).toBe(false);
    expect(checkDestination("javascript:alert(1)").ok).toBe(false);
    expect(checkDestination("data:text/html,hi").ok).toBe(false);
    expect(checkDestination("ftp://example.com").ok).toBe(false);
    expect(checkDestination("not a url").ok).toBe(false);
  });

  it("rejects URLs longer than the limit", () => {
    const long = "https://example.com/" + "a".repeat(MAX_DESTINATION_LENGTH);
    const r = checkDestination(long);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/characters/);
  });

  it("rejects embedded credentials", () => {
    expect(checkDestination("https://user:pass@example.com").ok).toBe(false);
    expect(checkDestination("https://user@example.com").ok).toBe(false);
  });

  it("rejects localhost and private / link-local addresses", () => {
    for (const u of [
      "http://localhost:3000",
      "http://app.localhost",
      "http://printer.local/",
      "http://127.0.0.1",
      "http://127.10.0.1",
      "http://10.0.0.5",
      "http://192.168.1.1",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://169.254.169.254/latest/meta-data",
      "http://0.0.0.0",
      "http://[::1]/",
      "http://[fe80::1]/",
      "http://[fd00::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://2130706433/", // decimal form of 127.0.0.1
    ]) {
      expect(checkDestination(u), u).toEqual({ ok: false, reason: expect.any(String) });
    }
  });

  it("allows public addresses next to the private ranges", () => {
    expect(checkDestination("http://172.15.0.1").ok).toBe(true);
    expect(checkDestination("http://172.32.0.1").ok).toBe(true);
    expect(checkDestination("http://192.169.0.1").ok).toBe(true);
  });

  it("blocks BLOCKED_DOMAINS and their subdomains only", () => {
    process.env.BLOCKED_DOMAINS = " bad.example , *.evil.test ";
    expect(checkDestination("https://bad.example/x").ok).toBe(false);
    expect(checkDestination("https://login.bad.example").ok).toBe(false);
    expect(checkDestination("https://BAD.EXAMPLE").ok).toBe(false);
    expect(checkDestination("https://evil.test").ok).toBe(false);
    expect(checkDestination("https://notbad.example").ok).toBe(true);
    expect(checkDestination("https://bad.example.com").ok).toBe(true);
  });

  it("allows everything public when BLOCKED_DOMAINS is unset", () => {
    delete process.env.BLOCKED_DOMAINS;
    expect(checkDestination("https://bad.example").ok).toBe(true);
  });
});
