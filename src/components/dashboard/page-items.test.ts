import { describe, expect, it } from "vitest";
import { pageItems } from "./page-items";

describe("pageItems", () => {
  it("lists every page when there are seven or fewer", () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps first, last and a window round the current page", () => {
    expect(pageItems(1, 12)).toEqual([1, 2, null, 12]);
    expect(pageItems(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(pageItems(12, 12)).toEqual([1, null, 11, 12]);
    expect(pageItems(3, 12)).toEqual([1, 2, 3, 4, null, 12]);
  });
});
