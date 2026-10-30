import { describe, expect, it } from "vitest";
import { applyMigrations } from "@/lib/db/migrate";
import { checkUpstream } from "@/lib/upstream/check";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("upstream check", () => {
  it("reports no update when the commit matches the imported revision", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      await opened.client.execute(
        "UPDATE data_sources SET latest_imported_revision = 'abc' WHERE source_name = 'pad-dash-formation'",
      );
      const result = await checkUpstream(opened.db, async (url) => {
        if (String(url).includes("/compare/")) {
          return jsonResponse({ files: [] });
        }
        return jsonResponse([{ sha: "abc" }]);
      });
      expect(result.status).toBe("up_to_date");
    } finally {
      opened.client.close();
    }
  });

  it("reports an available update without applying it", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      await opened.client.execute(
        "UPDATE data_sources SET latest_imported_revision = 'old' WHERE source_name = 'pad-dash-formation'",
      );
      const result = await checkUpstream(opened.db, async (url) => {
        if (String(url).includes("/compare/")) {
          return jsonResponse({ files: [{ filename: "monsters-info/mon_ja.json", status: "modified" }] });
        }
        return jsonResponse([{ sha: "def" }]);
      });
      expect(result.status).toBe("update_available");
      expect(result.changedFiles).toEqual(["modified monsters-info/mon_ja.json"]);
      const monsters = await opened.client.execute("SELECT COUNT(*) AS count FROM monsters");
      expect(Number(monsters.rows[0]?.count)).toBe(0);
    } finally {
      opened.client.close();
    }
  });

  it("records a GitHub API failure", async () => {
    const opened = await applyMigrations(":memory:");
    try {
      const result = await checkUpstream(opened.db, async () => jsonResponse({ message: "no" }, 403));
      expect(result.status).toBe("failed");
      expect(result.errorMessage).toContain("403");
    } finally {
      opened.client.close();
    }
  });
});
