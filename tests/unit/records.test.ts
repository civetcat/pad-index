import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dataSource } from "@/lib/source";
import {
  monsterRecordSchema,
  skillRecordSchema,
} from "@/lib/validation/records";

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(path.resolve(process.cwd(), "tests/fixtures", name), "utf8"),
  ) as unknown;

describe("published record schemas", () => {
  it("accepts the observed monster field shape and keeps unknown fields", () => {
    const parsed = monsterRecordSchema.parse({
      ...(fixture("monster-shape.json") as object),
      futureField: "keep-me",
    });

    expect(parsed.id).toBe(1);
    expect(parsed.otLangName?.en).toBe("Tyrra");
    expect(parsed.evoMaterials).toContain(0);
    expect(parsed.futureField).toBe("keep-me");
  });

  it("rejects a monster record without an id", () => {
    const record = fixture("monster-shape.json") as Record<string, unknown>;
    delete record.id;
    expect(monsterRecordSchema.safeParse(record).success).toBe(false);
  });

  it("accepts the published heat breath skill without dropping params", () => {
    const parsed = skillRecordSchema.parse(fixture("skill-heat-breath.json"));

    expect(parsed.name).toBe("ヒートブレス");
    expect(parsed.type).toBe(0);
    expect(parsed.params).toEqual([0, 1000]);
  });
});

describe("data source", () => {
  it("points at PADDashFormation monsters-info, not mon2 binaries", () => {
    expect(dataSource.repositoryUrl).toBe(
      "https://github.com/Mapaler/PADDashFormation",
    );
    expect(dataSource.branch).toBe("master");
    expect(dataSource.dataPath).toBe("monsters-info");
    expect(dataSource.files.monstersJa).toBe("monsters-info/mon_ja.json");
    expect(dataSource.files.skillsJa).toBe("monsters-info/skill_ja.json");
  });
});
