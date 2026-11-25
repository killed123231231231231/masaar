import { describe, expect, it } from "vitest";
import { csvCell } from "../csv";

describe("csvCell", () => {
  it("passes plain text through", () => {
    expect(csvCell("Madinah")).toBe("Madinah");
  });
  it("neutralises formula starters", () => {
    expect(csvCell('=HYPERLINK("https://evil","x")')).toBe(`"'=HYPERLINK(""https://evil"",""x"")"`);
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tx")).toBe("'\tx");
  });
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });
  it("handles null and numbers", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });
});
