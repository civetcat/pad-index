import { describe, expect, it } from "vitest";
import { catalogHref, parseMonsterFilters } from "@/lib/queries/filters";

describe("catalog filters", () => {
  it("ignores invalid numbers instead of guessing", () => {
    const filters = parseMonsterFilters({ attr: "fire", rarity: "8", page: "0" });
    expect(filters.attribute).toBeUndefined();
    expect(filters.rarity).toBe(8);
    expect(filters.page).toBe(1);
  });

  it("keeps combined filters in the result link", () => {
    expect(catalogHref({ q: "Tyrra", attribute: 0, effect: "heal" }, 2)).toBe(
      "/?q=Tyrra&attr=0&effect=heal&page=2",
    );
    expect(parseMonsterFilters({ awk: ["49x2", "21", "49x3", "no"] }).awakenings).toEqual([
      { code: 21, count: 1 },
      { code: 49, count: 3 },
    ]);
    expect(catalogHref({ awakenings: [{ code: 21, count: 1 }, { code: 49, count: 2 }], skill: "fire", slot: "leader" })).toBe(
      "/?awk=21&awk=49x2&skill=fire&slot=leader",
    );
    expect(parseMonsterFilters({ sub: "1" }).substitutes).toBe(true);
    expect(catalogHref({ q: "1", substitutes: true })).toBe("/?q=1&sub=1");
  });
});
