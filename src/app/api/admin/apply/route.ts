import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  adminAuthorized,
  adminUnavailableResponse,
  unauthorizedResponse,
} from "@/lib/admin/auth";
import { getAppDatabase } from "@/lib/db/app-db";
import { resolveDatabaseUrl } from "@/lib/db/migrate";
import {
  asJsonArray,
  downloadSourceFiles,
  fetchSourceRevision,
  saveSourceSnapshot,
} from "@/lib/import/fetch-source";
import { importParsedData } from "@/lib/import/run-import";

export async function POST(request: Request) {
  const unavailable = await adminUnavailableResponse();
  if (unavailable) {
    return unavailable;
  }
  if (!(await adminAuthorized(request))) {
    return unauthorizedResponse();
  }
  const revision = await fetchSourceRevision();
  const ref = revision ?? "master";
  const files = await downloadSourceFiles(ref);
  saveSourceSnapshot(ref, {
    "mon_ja.json": files.monsters.raw,
    "skill_ja.json": files.skills.raw,
    "skill_en.json": files.skillsEn.raw,
  });
  backupDatabase();
  const database = await getAppDatabase();
  const summary = await importParsedData(database.db, {
    revision,
    monsters: asJsonArray(files.monsters.parsed, "mon_ja.json"),
    skills: asJsonArray(files.skills.parsed, "skill_ja.json"),
    skillsEn: asJsonArray(files.skillsEn.parsed, "skill_en.json"),
    warnings: revision ? [] : ["無法取得 revision，source_revision 留空"],
  });
  return Response.json(summary, {
    status: summary.status === "validation_failed" ? 422 : 200,
  });
}

function backupDatabase() {
  const url = resolveDatabaseUrl();
  if (!url.startsWith("file:")) {
    return;
  }
  const filePath = path.resolve(url.slice("file:".length));
  if (!existsSync(filePath)) {
    return;
  }
  copyFileSync(filePath, `${filePath}.bak-${Date.now()}`);
}
