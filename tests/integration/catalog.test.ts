import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyMigrations } from "@/lib/db/migrate";
import { importParsedData } from "@/lib/import/run-import";
import { parseMonsterFilters } from "@/lib/queries/filters";
import { getMonster, listMonsters } from "@/lib/queries/monsters";
import { findSubstitutes } from "@/lib/queries/substitutes";
import heatBreath from "../fixtures/skill-heat-breath.json";

const shape = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tests/fixtures/monster-shape.json"), "utf8"),
) as Record<string, unknown>;

describe("catalog queries", () => {
  it("searches imported records and does not invent a missing monster", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      const summary = await importParsedData(opened.db, {
        revision: "test-revision",
        monsters: [shape, { ...shape, id: 1929, name: "base", evoBaseId: 0, activeSkillId: 0, leaderSkillId: 0 }],
        skills: [heatBreath, { ...heatBreath, id: 51, name: "leader", description: "未分類" }],
      });
      expect(summary.added).toBe(2);

      const byName = await listMonsters(opened.db, parseMonsterFilters({ q: "Tyrra" }));
      expect(byName.items.map((item) => item.monsterId)).toContain(1);

      const byAttribute = await listMonsters(opened.db, parseMonsterFilters({ attr: "0" }));
      expect(byAttribute.items.every((item) => item.attributePrimary === 0)).toBe(true);

      const byEffect = await listMonsters(
        opened.db,
        parseMonsterFilters({ effect: "attribute_damage", slot: "active" }),
      );
      expect(byEffect.items.map((item) => item.monsterId)).toEqual([1]);
      const memberSkill = await listMonsters(
        opened.db,
        parseMonsterFilters({ skill: "攻撃力×10倍", slot: "active" }),
      );
      expect(memberSkill.items.map((item) => item.monsterId)).toEqual([1]);
      const unlike = await listMonsters(
        opened.db,
        parseMonsterFilters({ skill: "轉珠", slot: "active" }),
      );
      expect(unlike.items).toEqual([]);
      const otherNumber = await listMonsters(
        opened.db,
        parseMonsterFilters({ skill: "100", slot: "active" }),
      );
      expect(otherNumber.items).toEqual([]);
      const leaderSkill = await listMonsters(
        opened.db,
        parseMonsterFilters({ skill: "火属性攻撃", slot: "leader" }),
      );
      expect(leaderSkill.items).toEqual([]);
      const leaderText = await listMonsters(
        opened.db,
        parseMonsterFilters({ skill: "未分類", slot: "leader" }),
      );
      expect(leaderText.items.map((item) => item.monsterId)).toEqual([1]);

      const detail = await getMonster(opened.db, 1);
      expect(detail?.previous?.monsterId).toBe(1929);
      expect(detail?.activeSkill?.name).toBe("ヒートブレス");
      expect(await getMonster(opened.db, 999999)).toBeNull();

      const again = await importParsedData(opened.db, {
        revision: "test-revision",
        monsters: [shape, { ...shape, id: 1929, name: "base", evoBaseId: 0, activeSkillId: 0, leaderSkillId: 0 }],
        skills: [heatBreath, { ...heatBreath, id: 51, name: "leader", description: "未分類" }],
      });
      expect(again.added).toBe(0);
      expect(again.unchanged).toBe(2);
    } finally {
      opened.client.close();
    }
  });

  it("lists only exact skill substitutes", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      await importParsedData(opened.db, {
        revision: "test-revision",
        monsters: [
          shape,
          { ...shape, id: 2, name: "same-skill", evoBaseId: 0 },
          { ...shape, id: 3, name: "same-text", evoBaseId: 0, activeSkillId: 9, leaderSkillId: 0 },
          { ...shape, id: 4, name: "other-number", evoBaseId: 0, activeSkillId: 10, leaderSkillId: 0 },
        ],
        skills: [
          heatBreath,
          { ...heatBreath, id: 9, name: "alias" },
          { ...heatBreath, id: 10, name: "thirteen", description: "敵全体に攻撃力×13倍の火属性攻撃。" },
          { ...heatBreath, id: 51, name: "leader", description: "未分類" },
        ],
      });
      const groups = await findSubstitutes(opened.db, 1);
      expect(groups?.find((group) => group.title === "相同主動技能")?.monsters.map((item) => item.monsterId)).toEqual([2]);
      expect(groups?.find((group) => group.title === "主動技能相近")?.monsters.map((item) => item.monsterId).sort()).toEqual([3, 4]);
      const expanded = await listMonsters(opened.db, parseMonsterFilters({ q: "1", sub: "1" }));
      expect(expanded.items.map((item) => item.monsterId).sort()).toEqual([1, 2, 3, 4]);
    } finally {
      opened.client.close();
    }
  });

  it("matches attribute absorb when the turn count and the rest of the sentence differ", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      await importParsedData(opened.db, {
        revision: "absorb",
        monsters: [
          { ...shape, id: 10, name: "ten-turn", evoBaseId: 0, activeSkillId: 100, leaderSkillId: 0 },
          { ...shape, id: 11, name: "combined", evoBaseId: 0, activeSkillId: 101, leaderSkillId: 0 },
          { ...shape, id: 12, name: "split-line", evoBaseId: 0, activeSkillId: 102, leaderSkillId: 0 },
          { ...shape, id: 13, name: "board-only", evoBaseId: 0, activeSkillId: 103, leaderSkillId: 0 },
        ],
        skills: [
          { ...heatBreath, id: 100, name: "ten", description: "10ターンの間、属性吸収を無効化。\n盤面を[火][水][回復]に変化。" },
          { ...heatBreath, id: 101, name: "two", description: "2ターンの間、ダメージ吸収と属性吸収を無効化。" },
          { ...heatBreath, id: 102, name: "seven", description: "7ターンの間、属性吸収を\n無効化。" },
          { ...heatBreath, id: 103, name: "board", description: "盤面を[火][水][回復]に変化。" },
        ],
      });
      const groups = await findSubstitutes(opened.db, 10);
      expect(groups?.find((group) => group.title === "主動技能相近")?.monsters.map((item) => item.monsterId).sort()).toEqual([11, 12]);
      const expanded = await listMonsters(opened.db, parseMonsterFilters({ q: "10", sub: "1" }));
      expect(expanded.items.map((item) => item.monsterId).sort()).toEqual([10, 11, 12]);
    } finally {
      opened.client.close();
    }
  });
});
