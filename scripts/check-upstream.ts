import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { migrateDatabase, openDatabase } from "../src/lib/db/migrate";
import { checkUpstream } from "../src/lib/upstream/check";

async function main() {
  await migrateDatabase();
  const opened = await openDatabase();
  try {
    const result = await checkUpstream(opened.db);
    const output = path.resolve("data/upstream-check.json");
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "failed" || result.status === "validation_failed") {
      process.exitCode = 1;
    }
  } finally {
    opened.client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
