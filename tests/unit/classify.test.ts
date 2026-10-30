import { describe, expect, it } from "vitest";
import { classifySkill } from "@/lib/skills/classify";
import { presentSkill } from "@/lib/skills/present";
import { skillTokenIcon } from "@/lib/skills/tokens";
import heatBreath from "../fixtures/skill-heat-breath.json";

describe("skill classifier", () => {
  it("keeps the observed type 0 heat breath as attribute damage", () => {
    const effects = classifySkill(heatBreath);
    expect(effects.some((effect) => effect.effectCategory === "attribute_damage")).toBe(true);
    expect(effects.every((effect) => effect.rawEffectText.includes("火属性"))).toBe(true);
  });

  it("retains an unrecognized skill instead of dropping it", () => {
    const effects = classifySkill({
      type: 99999,
      description: "まだ分類していない効果",
      params: [1],
    });
    expect(effects).toHaveLength(1);
    expect(effects[0]?.parseStatus).toBe("unparsed");
    expect(effects[0]?.rawEffectText).toBe("まだ分類していない効果");
  });

  it("can attach more than one category to one description", () => {
    const effects = classifySkill({
      type: 7,
      description: "ダメージ吸収を無効。HPを回復。",
      params: [],
    });
    const categories = effects.map((effect) => effect.effectCategory);
    expect(categories).toContain("damage_absorb_void");
    expect(categories).toContain("heal");
  });

  it("does not treat skill delay resistance as a delay effect", () => {
    const effects = classifySkill({
      type: 116,
      description: "[スキル遅延耐性]を付与。自分以外のスキルが2ターン溜まる。",
      params: [],
    });
    expect(effects.map((effect) => effect.effectCategory)).not.toContain("delay");
    expect(effects.map((effect) => effect.effectCategory)).toContain("haste");
  });

  it("separates an assist note from the awakenings it grants", () => {
    const presented = presentSkill(
      "^qs^スキル使用時、このアシストが消滅する。^p\n[副属性変更・闇]を付与。自分以外のスキルが2ターン溜まる。",
    );
    expect(presented.assistVanishes).toBe(true);
    expect(presented.body).toContain("[副属性変更・闇]");
    expect(presented.hasteTurns).toBe(2);
  });

  it("maps bracketed orbs and locks to icons", () => {
    expect(skillTokenIcon("木")).toEqual({ kind: "orb", row: 2, label: "木" });
    expect(skillTokenIcon("ロック")?.kind).toBe("lock");
    expect(skillTokenIcon("バインド耐性+")?.kind).toBe("awakening");
    expect(skillTokenIcon("釘ドロップ")).toEqual({ kind: "skill", column: 0, row: 35, label: "釘珠" });
    expect(skillTokenIcon("HF")).toBeNull();
  });
});
