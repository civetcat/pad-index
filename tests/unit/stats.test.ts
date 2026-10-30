import { describe, expect, it } from "vitest";
import { plusBonus, statAtLevel } from "@/lib/stats";

describe("monster stat levels", () => {
  it("uses the stored minimum and maximum at level 1 and 99", () => {
    const card = {
      min: 3241,
      max: 9724,
      scale: 1,
      maxLevel: 99,
      limitBreakPercent: 0,
      kind: "hp" as const,
    };
    expect(statAtLevel({ ...card, level: 1 })).toBe(3241);
    expect(statAtLevel({ ...card, level: 99 })).toBe(9724);
    expect(statAtLevel({ ...card, level: 110 })).toBeNull();
    expect(statAtLevel({ ...card, level: 120, canLimitBreak: true })).toBe(10696);
    expect(statAtLevel({ ...card, level: 110, canLimitBreak: true })).toBe(9724);
  });

  it("applies limit break only when the card has a growth percent", () => {
    const card = {
      min: 321,
      max: 2137,
      scale: 1,
      maxLevel: 99,
      limitBreakPercent: 10,
      kind: "hp" as const,
    };
    expect(statAtLevel({ ...card, level: 110 })).toBe(2351);
    expect(statAtLevel({ ...card, level: 120 })).toBe(2564);
    expect(statAtLevel({ ...card, kind: "atk", level: 120 })).toBe(2458);
  });

  it("adds the official plus amounts", () => {
    expect(plusBonus("hp", 99)).toBe(990);
    expect(plusBonus("atk", 100)).toBe(500);
    expect(plusBonus("rcv", 297)).toBe(891);
  });
});
