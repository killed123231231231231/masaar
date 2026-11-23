import { describe, expect, it } from "vitest";
import { abuseReportMessage, isReportableShortId } from "../abuse-report";

describe("isReportableShortId", () => {
  it("accepts current and legacy short ids", () => {
    expect(isReportableShortId("aB3dE5f")).toBe(true);
    expect(isReportableShortId("WgcQX3E")).toBe(true);
    expect(isReportableShortId("legacy_id-01")).toBe(true);
  });

  it("rejects empty, oversized and unsafe values", () => {
    expect(isReportableShortId("")).toBe(false);
    expect(isReportableShortId("a".repeat(33))).toBe(false);
    expect(isReportableShortId("abc<script>")).toBe(false);
    expect(isReportableShortId("abc def")).toBe(false);
    expect(isReportableShortId("../etc")).toBe(false);
    expect(isReportableShortId(undefined)).toBe(false);
    expect(isReportableShortId(["abc"])).toBe(false);
  });
});

describe("abuseReportMessage", () => {
  it("puts the QR id on the first line", () => {
    const msg = abuseReportMessage("aB3dE5f", "Phishing page");
    expect(msg.split("\n")[0]).toBe("[Abuse report] QR: aB3dE5f (/r/aB3dE5f)");
    expect(msg.endsWith("Phishing page")).toBe(true);
  });
});
