import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyMigrations } from "@/lib/db/migrate";
import { importParsedData } from "@/lib/import/run-import";
import { parseMonsterFilters } from "@/lib/queries/filters";
import { getMonster, listMonsters } from "@/lib/queries/monsters";
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
        parseMonsterFilters({ effect: "attribute_damage" }),
      );
      expect(byEffect.items.map((item) => item.monsterId)).toEqual([1]);

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
});
