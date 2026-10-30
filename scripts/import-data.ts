import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { migrateDatabase, openDatabase, resolveDatabaseUrl } from "../src/lib/db/migrate";
import {
  asJsonArray,
  downloadSourceFiles,
  fetchSourceRevision,
  saveSourceSnapshot,
} from "../src/lib/import/fetch-source";
import { importParsedData } from "../src/lib/import/run-import";

async function main() {
  const revision = await fetchSourceRevision().catch(() => null);
  const ref = revision ?? "master";
  const files = await downloadSourceFiles(ref);
  saveSourceSnapshot(ref, {
    "mon_ja.json": files.monsters.raw,
    "skill_ja.json": files.skills.raw,
    "skill_en.json": files.skillsEn.raw,
  });
  backupDatabase();
  await migrateDatabase();
  const opened = await openDatabase();
  try {
    const summary = await importParsedData(opened.db, {
      revision,
      monsters: asJsonArray(files.monsters.parsed, "mon_ja.json"),
      skills: asJsonArray(files.skills.parsed, "skill_ja.json"),
      skillsEn: asJsonArray(files.skillsEn.parsed, "skill_en.json"),
      warnings: revision ? [] : ["無法取得 GitHub revision，source_revision 留空"],
    });
    console.log(JSON.stringify(summary, null, 2));
    if (summary.status === "validation_failed") {
      process.exitCode = 1;
    }
  } finally {
    opened.client.close();
  }
}

function backupDatabase() {
  const url = resolveDatabaseUrl();
  if (!url.startsWith("file:")) {
    return;
  }
  const filePath = path.resolve(url.slice("file:".length));
  if (existsSync(filePath)) {
    copyFileSync(filePath, `${filePath}.bak-${Date.now()}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
