import { describe, expect, it } from "vitest";
import { cardArtUrl, cardFramePlacement, portraitPlacement } from "@/lib/portraits";
import { classifySkill } from "@/lib/skills/classify";

describe("portraits and skill text", () => {
  it("maps monster 1 to the first cell of the Japanese card sheet", () => {
    expect(portraitPlacement(1)).toEqual({
      url: "https://mapaler.github.io/PADDashFormation/images/cards_ja/CARDS_001.PNG",
      x: 0,
      y: 0,
    });
    expect(portraitPlacement(101)?.url).toContain("CARDS_002.PNG");
    expect(cardArtUrl(13904)).toBe("https://pazparty.com/b_img/13904.jpg");
    expect(cardArtUrl(0)).toBeNull();
  });

  it("stacks the game card frame by attribute slot", () => {
    expect(cardFramePlacement(0, 0)).toEqual({ column: 0, row: 0 });
    expect(cardFramePlacement(4, 1)).toEqual({ column: 4, row: 1 });
    expect(cardFramePlacement(0, 2)).toEqual({ column: 0, row: 2 });
    expect(cardFramePlacement(null, 1)).toBeNull();
    expect(cardFramePlacement(6, 1)).toBeNull();
  });

  it("keeps each Japanese sentence and tags the effects written in it", () => {
    const effects = classifySkill({
      type: 116,
      description: "4ターンの間、火属性の攻撃力が2倍。\n敵全体に攻撃力×20倍の火属性攻撃。",
      params: [1106, 1006],
    });
    expect(effects.map((effect) => effect.effectCategory)).toEqual(
      expect.arrayContaining(["attack_boost", "attribute_damage"]),
    );
    expect(effects.every((effect) => effect.rawEffectText.length > 0)).toBe(true);
  });
});
