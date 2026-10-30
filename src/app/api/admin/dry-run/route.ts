import {
  adminAuthorized,
  adminUnavailableResponse,
  unauthorizedResponse,
} from "@/lib/admin/auth";
import { getAppDatabase } from "@/lib/db/app-db";
import { monsters } from "@/lib/db/schema";
import {
  asJsonArray,
  downloadSourceFiles,
  fetchSourceRevision,
} from "@/lib/import/fetch-source";
import { parseMonsterBatch, parseSkillBatch } from "@/lib/import/map-records";
import { count } from "drizzle-orm";

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
  const monsterBatch = parseMonsterBatch(asJsonArray(files.monsters.parsed, "mon_ja.json"));
  const skillBatch = parseSkillBatch(asJsonArray(files.skills.parsed, "skill_ja.json"));
  const database = await getAppDatabase();
  const current = await database.db.select({ total: count() }).from(monsters);
  const currentCount = current[0]?.total ?? 0;
  const incomingIds = new Set(monsterBatch.records.map((record) => record.id));
  return Response.json({
    status: monsterBatch.errors.length > 50 ? "validation_failed" : "dry_run",
    latestRevision: revision,
    currentCount,
    incomingCount: monsterBatch.records.length,
    skillCount: skillBatch.records.length,
    parseErrors: monsterBatch.errors.length + skillBatch.errors.length,
    sampleErrors: [...monsterBatch.errors, ...skillBatch.errors].slice(0, 10),
    canApply: monsterBatch.records.length > 0 && skillBatch.records.length > 0,
    note: incomingIds.size === monsterBatch.records.length ? "怪物 ID 沒有重複" : "怪物 ID 有重複，拒絕套用",
  });
}
