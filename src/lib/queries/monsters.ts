import { type SQL, and, asc, count, desc, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import {
  evolutions,
  monsters,
  skills,
} from "@/lib/db/schema";
import { skillSearchNeedles } from "@/lib/skills/search";
import { likenessMatch } from "@/lib/skills/similar-sql";
import type { MonsterFilters } from "./filters";

const briefColumns = {
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
};

export type MonsterBrief = {
  monsterId: number;
  name: string;
  nameEn: string | null;
  nameCht: string | null;
  attributePrimary: number | null;
  attributeSecondary: number | null;
  attributeTertiary: number | null;
  rarity: number | null;
  types: number[];
  maxLevel: number | null;
  hpMax: number | null;
  atkMax: number | null;
  rcvMax: number | null;
};

export async function listMonsters(db: LibSQLDatabase, filters: MonsterFilters) {
  const similar = filters.substitutes && hasSearchConstraint(filters)
    ? await likenessFromMatches(db, filters)
    : null;
  const where = monsterWhere(filters, similar);
  const totalRow = await db.select({ total: count() }).from(monsters).where(where);
  const total = totalRow[0]?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pageCount);
  const rows = await db
    .select(briefColumns)
    .from(monsters)
    .where(where)
    .orderBy(
      filters.q && /^\d+$/.test(filters.q)
        ? sql`CASE WHEN ${monsters.monsterId} = ${Number(filters.q)} THEN 0 ELSE 1 END`
        : asc(monsters.monsterId),
      asc(monsters.monsterId),
    )
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize);
  return {
    items: rows.map(toBrief),
    total,
    page,
    pageCount,
  };
}

export async function getMonster(db: LibSQLDatabase, monsterId: number) {
  const rows = await db
    .select()
    .from(monsters)
    .where(eq(monsters.monsterId, monsterId))
    .limit(1);
  const monster = rows[0];
  if (!monster) {
    return null;
  }
  const skillIds = [monster.activeSkillId, monster.leaderSkillId].filter(
    (id): id is number => typeof id === "number" && id > 0,
  );
  const skillRows = skillIds.length
    ? await db.select().from(skills).where(inArray(skills.skillId, skillIds))
    : [];
  const skillById = new Map(skillRows.map((skill) => [skill.skillId, skill]));
  const previous = monster.evoBaseId
    ? await getBrief(db, monster.evoBaseId)
    : null;
  const nextRows = await db
    .select(briefColumns)
    .from(monsters)
    .where(eq(monsters.evoBaseId, monsterId))
    .orderBy(asc(monsters.monsterId));
  const materialIds = parseNumberArray(monster.evoMaterialsJson).filter((id) => id > 0);
  const materials = await getBriefs(db, materialIds);
  const series = monster.evoRootId
    ? (
        await db
          .select(briefColumns)
          .from(monsters)
          .where(
            and(
              eq(monsters.evoRootId, monster.evoRootId),
              ne(monsters.monsterId, monsterId),
              eq(monsters.isEmpty, false),
            ),
          )
          .orderBy(asc(monsters.monsterId))
          .limit(40)
      ).map(toBrief)
    : [];
  const evolutionRow = await db
    .select({
      evolutionType: evolutions.evolutionType,
      materialsJson: evolutions.materialsJson,
    })
    .from(evolutions)
    .where(eq(evolutions.toMonsterId, monsterId))
    .limit(1);

  return {
    monster,
    types: parseNumberArray(monster.typesJson),
    awakenings: parseNumberArray(monster.awakeningsJson),
    superAwakenings: parseNumberArray(monster.superAwakeningsJson),
    activeSkill: skillById.get(monster.activeSkillId ?? -1) ?? null,
    leaderSkill: skillById.get(monster.leaderSkillId ?? -1) ?? null,
    activeGrants: await grantedAwakenings(db, skillById.get(monster.activeSkillId ?? -1)),
    leaderGrants: await grantedAwakenings(db, skillById.get(monster.leaderSkillId ?? -1)),
    previous,
    next: nextRows.map(toBrief),
    materials,
    missingMaterialIds: materialIds.filter(
      (id) => !materials.some((material) => material.monsterId === id),
    ),
    series,
    evolutionType: evolutionRow[0]?.evolutionType ?? null,
  };
}

export async function neighborMonsterIds(db: LibSQLDatabase, monsterId: number) {
  const visible = and(eq(monsters.isEmpty, false), eq(monsters.enabled, true));
  const previous = await db
    .select({ monsterId: monsters.monsterId })
    .from(monsters)
    .where(and(visible, lt(monsters.monsterId, monsterId)))
    .orderBy(desc(monsters.monsterId))
    .limit(1);
  const next = await db
    .select({ monsterId: monsters.monsterId })
    .from(monsters)
    .where(and(visible, gt(monsters.monsterId, monsterId)))
    .orderBy(asc(monsters.monsterId))
    .limit(1);
  return {
    previous: previous[0]?.monsterId ?? null,
    next: next[0]?.monsterId ?? null,
  };
}

async function grantedAwakenings(
  db: LibSQLDatabase,
  skill: { skillType: number | null; paramsJson: string } | undefined,
) {
  if (!skill || skill.skillType !== 116) {
    return [];
  }
  const childIds = parseNumberArray(skill.paramsJson).filter((id) => id > 0);
  if (childIds.length === 0) {
    return [];
  }
  const children = await db
    .select({ skillType: skills.skillType, paramsJson: skills.paramsJson })
    .from(skills)
    .where(inArray(skills.skillId, childIds));
  return children.flatMap((child) =>
    child.skillType === 250
      ? parseNumberArray(child.paramsJson).filter((code) => code >= 1 && code <= 200)
      : [],
  );
}

async function getBrief(db: LibSQLDatabase, monsterId: number) {
  const rows = await getBriefs(db, [monsterId]);
  return rows[0] ?? null;
}

async function getBriefs(db: LibSQLDatabase, ids: number[]) {
  if (ids.length === 0) {
    return [];
  }
  const rows = await db
    .select(briefColumns)
    .from(monsters)
    .where(inArray(monsters.monsterId, ids));
  const byId = new Map(rows.map((row) => [row.monsterId, toBrief(row)]));
  return ids.flatMap((id) => {
    const brief = byId.get(id);
    return brief ? [brief] : [];
  });
}

function monsterWhere(filters: MonsterFilters, similar: SQL | null) {
  const base = baseWhere(filters);
  if (!filters.substitutes || !hasSearchConstraint(filters) || !similar) {
    return base;
  }
  return and(
    eq(monsters.isEmpty, false),
    eq(monsters.enabled, true),
    or(
      sql`${monsters.monsterId} IN (SELECT ${monsters.monsterId} FROM ${monsters} WHERE ${base})`,
      sql`${monsters.activeSkillId} IN (SELECT skill_id FROM skills WHERE ${similar})`,
      sql`${monsters.leaderSkillId} IN (SELECT skill_id FROM skills WHERE ${similar})`,
    ),
  );
}

async function likenessFromMatches(db: LibSQLDatabase, filters: MonsterFilters) {
  const hits = await db
    .select({
      activeSkillId: monsters.activeSkillId,
      leaderSkillId: monsters.leaderSkillId,
    })
    .from(monsters)
    .where(baseWhere(filters))
    .limit(30);
  const skillIds = [...new Set(
    hits.flatMap((hit) => [hit.activeSkillId, hit.leaderSkillId]).filter((id): id is number => typeof id === "number" && id > 0),
  )].slice(0, 40);
  if (skillIds.length === 0) {
    return null;
  }
  const rows = await db
    .select({ description: skills.description })
    .from(skills)
    .where(inArray(skills.skillId, skillIds));
  return likenessMatch(rows.map((row) => row.description));
}

function hasSearchConstraint(filters: MonsterFilters) {
  return Boolean(
    filters.q
    || filters.attribute !== undefined
    || filters.rarity !== undefined
    || filters.type !== undefined
    || filters.awakenings.length
    || filters.skill
    || filters.effect
    || filters.slot,
  );
}

function baseWhere(filters: MonsterFilters) {
  const clauses = [eq(monsters.isEmpty, false), eq(monsters.enabled, true)];
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    const textMatch = or(
      sql`${monsters.name} LIKE ${pattern} ESCAPE '\\'`,
      sql`${monsters.nameEn} LIKE ${pattern} ESCAPE '\\'`,
      sql`${monsters.nameCht} LIKE ${pattern} ESCAPE '\\'`,
      sql`${monsters.nameChs} LIKE ${pattern} ESCAPE '\\'`,
      sql`${monsters.nameKo} LIKE ${pattern} ESCAPE '\\'`,
    );
    const textClause = textMatch ?? sql`1 = 0`;
    clauses.push(
      /^\d+$/.test(filters.q)
        ? or(eq(monsters.monsterId, Number(filters.q)), textClause) ?? textClause
        : textClause,
    );
  }
  if (filters.attribute !== undefined) {
    clauses.push(
      or(
        eq(monsters.attributePrimary, filters.attribute),
        eq(monsters.attributeSecondary, filters.attribute),
        eq(monsters.attributeTertiary, filters.attribute),
      ) ?? eq(monsters.attributePrimary, filters.attribute),
    );
  }
  if (filters.rarity !== undefined) {
    clauses.push(eq(monsters.rarity, filters.rarity));
  }
  if (filters.type !== undefined) {
    clauses.push(
      sql`EXISTS (SELECT 1 FROM json_each(${monsters.typesJson}) WHERE json_each.value = ${filters.type})`,
    );
  }
  for (const awakening of filters.awakenings) {
    clauses.push(
      awakening.count <= 1
        ? sql`EXISTS (
            SELECT 1 FROM monster_awakenings
            WHERE monster_id = ${monsters.monsterId} AND awakening_code = ${awakening.code}
          )`
        : sql`(
            SELECT COUNT(*) FROM monster_awakenings
            WHERE monster_id = ${monsters.monsterId}
              AND awakening_code = ${awakening.code}
              AND awakening_type = 'normal'
          ) >= ${awakening.count}`,
    );
  }
  const skillClause = skillMatch(filters);
  if (skillClause) {
    clauses.push(skillClause);
  }
  return and(...clauses);
}

function skillMatch(filters: MonsterFilters) {
  const parts: SQL[] = [];
  if (filters.slot) {
    parts.push(sql`monster_skills.slot_type = ${filters.slot}`);
  }
  const skillText = skillTextClause(filters.skill);
  if (skillText) {
    parts.push(skillText);
  }
  if (filters.effect) {
    parts.push(sql`EXISTS (
      SELECT 1 FROM skill_effects
      WHERE skill_effects.skill_id = monster_skills.skill_id
        AND skill_effects.effect_category = ${filters.effect}
        AND skill_effects.parse_status != 'unparsed'
    )`);
  }
  if (parts.length === 0) {
    return null;
  }
  const where = parts.reduce((left, right) => sql`${left} AND ${right}`);
  return sql`${monsters.monsterId} IN (
    SELECT monster_skills.monster_id
    FROM monster_skills
    JOIN skills ON skills.skill_id = monster_skills.skill_id
    WHERE ${where}
  )`;
}

function skillTextClause(input: string) {
  const needles = skillSearchNeedles(input);
  if (needles.length === 0) {
    return null;
  }
  const parts = needles.map((needle) => {
    const like = `%${needle.replace(/[\\%_]/g, "\\$&")}%`;
    const compact = `%${needle.replace(/[をがにで\\%_]/g, (char) => (char === "\\" || char === "%" || char === "_" ? `\\${char}` : ""))}%`;
    return sql`(
      skills.name LIKE ${like} ESCAPE '\\'
      OR skills.description LIKE ${like} ESCAPE '\\'
      OR replace(replace(replace(replace(skills.description, 'を', ''), 'が', ''), 'に', ''), 'で', '') LIKE ${compact} ESCAPE '\\'
    )`;
  });
  return parts.reduce((left, right) => sql`(${left}) AND (${right})`);
}

function toBrief(row: {
  monsterId: number;
  name: string;
  nameEn: string | null;
  nameCht: string | null;
  attributePrimary: number | null;
  attributeSecondary: number | null;
  attributeTertiary: number | null;
  rarity: number | null;
  typesJson: string;
  maxLevel: number | null;
  hpMax: number | null;
  atkMax: number | null;
  rcvMax: number | null;
}): MonsterBrief {
  return {
    monsterId: row.monsterId,
    name: row.name,
    nameEn: row.nameEn,
    nameCht: row.nameCht,
    attributePrimary: row.attributePrimary,
    attributeSecondary: row.attributeSecondary,
    attributeTertiary: row.attributeTertiary,
    rarity: row.rarity,
    types: parseNumberArray(row.typesJson),
    maxLevel: row.maxLevel,
    hpMax: row.hpMax,
    atkMax: row.atkMax,
    rcvMax: row.rcvMax,
  };
}

function parseNumberArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is number => typeof item === "number")
      : [];
  } catch {
    return [];
  }
}
