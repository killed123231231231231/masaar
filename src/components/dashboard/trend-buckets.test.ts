import { describe, expect, it } from "vitest";
import { bucketTrend, pickGranularity } from "./trend-buckets";

describe("pickGranularity", () => {
  it("keeps short ranges daily and groups long ones", () => {
    expect(pickGranularity("7d", 7)).toBe("day");
    expect(pickGranularity("30d", 30)).toBe("day");
    expect(pickGranularity("90d", 90)).toBe("week");
    expect(pickGranularity("all", 20)).toBe("day");
    expect(pickGranularity("all", 120)).toBe("week");
    expect(pickGranularity("all", 400)).toBe("month");
  });
});

describe("bucketTrend", () => {
  it("returns no points for an empty series", () => {
    expect(bucketTrend([], "30d").points).toEqual([]);
  });

  it("labels days and zero-fills gaps", () => {
    const { granularity, points } = bucketTrend(
      [
        { label: "2026-11-01", count: 2 },
        { label: "2026-11-03", count: 5 },
      ],
      "all",
    );
    expect(granularity).toBe("day");
    expect(points.map((p) => [p.date, p.count])).toEqual([
      ["Nov 1", 2],
      ["Nov 2", 0],
      ["Nov 3", 5],
    ]);
  });

  it("groups 90 days into Monday-start weeks and keeps the total", () => {
    const series = Array.from({ length: 14 }, (_, i) => ({
      label: `2026-11-${String(i + 2).padStart(2, "0")}`, // Mon Nov 2 .. Sun Nov 15
      count: 1,
    }));
    const { granularity, points } = bucketTrend(series, "90d");
    expect(granularity).toBe("week");
    expect(points).toEqual([
      { date: "Nov 2", full: "Week of Nov 2", count: 7 },
      { date: "Nov 9", full: "Week of Nov 9", count: 7 },
    ]);
  });

  it("groups long all-time ranges by month", () => {
    const { granularity, points } = bucketTrend(
      [
        { label: "2025-10-15", count: 3 },
        { label: "2026-11-20", count: 4 },
      ],
      "all",
    );
    expect(granularity).toBe("month");
    expect(points[0]).toEqual({ date: "Oct 2025", full: "Oct 2025", count: 3 });
    expect(points[points.length - 1]).toEqual({ date: "Nov 2026", full: "Nov 2026", count: 4 });
    expect(points.reduce((s, p) => s + p.count, 0)).toBe(7);
  });
});
