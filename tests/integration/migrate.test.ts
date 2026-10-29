import { describe, expect, it } from "vitest";
import { applyMigrations } from "@/lib/db/migrate";
import { dataSource } from "@/lib/source";

describe("local migration", () => {
  it("creates the schema and records the configured source", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      const tables = await opened.client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );
      const names = tables.rows.map((row) => String(row.name));
      expect(names).toEqual(
        expect.arrayContaining([
          "monsters",
          "skills",
          "monster_skills",
          "awakenings",
          "monster_awakenings",
          "evolutions",
          "data_sources",
          "import_runs",
        ]),
      );

      const sources = await opened.client.execute(
        "SELECT source_name, repository_url, data_path, status FROM data_sources",
      );
      expect(sources.rows).toEqual([
        {
          source_name: dataSource.name,
          repository_url: dataSource.repositoryUrl,
          data_path: dataSource.dataPath,
          status: "not_imported",
        },
      ]);

      const monsters = await opened.client.execute(
        "SELECT COUNT(*) AS count FROM monsters",
      );
      expect(Number(monsters.rows[0]?.count)).toBe(0);
    } finally {
      opened.client.close();
    }
  });
});
