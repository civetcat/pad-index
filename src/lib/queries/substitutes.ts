import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { monsters, skills } from "@/lib/db/schema";
import { likenessMatch } from "@/lib/skills/similar-sql";
import type { MonsterBrief } from "./monsters";

export type SubstituteGroup = {
  title: string;
  note: string;
  total: number;
  monsters: MonsterBrief[];
};

export async function findSubstitutes(db: LibSQLDatabase, monsterId: number, limit = 48) {
  const rows = await db
    .select({
      monsterId: monsters.monsterId,
      activeSkillId: monsters.activeSkillId,
      leaderSkillId: monsters.leaderSkillId,
    })
    .from(monsters)
    .where(eq(monsters.monsterId, monsterId))
    .limit(1);
  const monster = rows[0];
  if (!monster) {
    return null;
  }
  const [active, leader] = await Promise.all([
    skillText(db, monster.activeSkillId),
    skillText(db, monster.leaderSkillId),
  ]);
  const groups = await Promise.all([
    bySkillId(db, "active", monster.activeSkillId, monsterId, limit),
    bySimilarSkill(db, "active", active, monster.activeSkillId, monsterId, limit),
    bySkillId(db, "leader", monster.leaderSkillId, monsterId, limit),
    bySimilarSkill(db, "leader", leader, monster.leaderSkillId, monsterId, limit),
  ]);
  return groups.filter((group) => group.total > 0);
}

async function skillText(db: LibSQLDatabase, skillId: number | null) {
  if (!skillId) {
    return "";
  }
  const rows = await db
    .select({ description: skills.description })
    .from(skills)
    .where(eq(skills.skillId, skillId))
    .limit(1);
  return rows[0]?.description?.trim() ?? "";
}

async function bySkillId(
  db: LibSQLDatabase,
  slot: "active" | "leader",
  skillId: number | null,
  monsterId: number,
  limit: number,
): Promise<SubstituteGroup> {
  const title = slot === "active" ? "相同主動技能" : "相同隊長技能";
  if (!skillId) {
    return { title, note: "這隻沒有這欄技能。", total: 0, monsters: [] };
  }
  const column = slot === "active" ? monsters.activeSkillId : monsters.leaderSkillId;
  const where = and(
    eq(column, skillId),
    ne(monsters.monsterId, monsterId),
    eq(monsters.isEmpty, false),
    eq(monsters.enabled, true),
  );
  return loadGroup(db, where, title, "技能編號完全相同。", limit);
}

async function bySimilarSkill(
  db: LibSQLDatabase,
  slot: "active" | "leader",
  description: string,
  skillId: number | null,
  monsterId: number,
  limit: number,
): Promise<SubstituteGroup> {
  const title = slot === "active" ? "主動技能相近" : "隊長技能相近";
  const similar = likenessMatch(description ? [description] : []);
  if (!skillId || !similar) {
    return { title, note: "沒有可對照的技能效果。", total: 0, monsters: [] };
  }
  const column = slot === "active" ? monsters.activeSkillId : monsters.leaderSkillId;
  const where = and(
    ne(column, skillId),
    ne(monsters.monsterId, monsterId),
    eq(monsters.isEmpty, false),
    eq(monsters.enabled, true),
    sql`${column} IN (SELECT skill_id FROM skills WHERE ${similar})`,
  );
  return loadGroup(db, where, title, "數字可以不同。13 回合和 10 回合的同一種效果會對上。太多時先顯示較新的。", limit, "desc");
}

async function loadGroup(
  db: LibSQLDatabase,
  where: ReturnType<typeof and>,
  title: string,
  note: string,
  limit: number,
  direction: "asc" | "desc" = "asc",
): Promise<SubstituteGroup> {
  const totalRow = await db.select({ total: count() }).from(monsters).where(where);
  const rows = await db
    .select({
      monsterId: monsters.monsterId,
      name: monsters.name,
      nameEn: monsters.nameEn,
      nameCht: monsters.nameCht,
      attributePrimary: monsters.attributePrimary,
      attributeSecondary: monsters.attributeSecondary,
      attributeTertiary: monsters.attributeTertiary,
      rarity: monsters.rarity,
      typesJson: monsters.typesJson,
      maxLevel: monsters.maxLevel,
      hpMax: monsters.hpMax,
      atkMax: monsters.atkMax,
      rcvMax: monsters.rcvMax,
    })
    .from(monsters)
    .where(where)
    .orderBy(direction === "desc" ? desc(monsters.monsterId) : asc(monsters.monsterId))
    .limit(limit);
  return {
    title,
    note,
    total: totalRow[0]?.total ?? 0,
    monsters: rows.map((row) => ({
      ...row,
      types: parseTypes(row.typesJson),
    })),
  };
}

function parseTypes(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is number => typeof item === "number") : [];
  } catch {
    return [];
  }
}
