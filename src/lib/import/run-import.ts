import { inArray, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import {
  dataSources,
  evolutions,
  importRuns,
  monsterAwakenings,
  monsterSkills,
  monsters,
  skillEffects,
  skills,
} from "@/lib/db/schema";
import { classifySkill } from "@/lib/skills/classify";
import { dataSource } from "@/lib/source";
import {
  evolutionEdge,
  mapMonster,
  mapSkill,
  parseMonsterBatch,
  parseSkillBatch,
  type MonsterInsert,
  type SkillInsert,
} from "./map-records";

const CHUNK = 40;

export type ImportSummary = {
  revision: string | null;
  added: number;
  updated: number;
  unchanged: number;
  errorCount: number;
  errors: string[];
  skillCount: number;
  status: "completed" | "validation_failed" | "failed";
};

export async function importParsedData(
  db: LibSQLDatabase,
  input: {
    revision: string | null;
    monsters: unknown[];
    skills: unknown[];
    skillsEn?: unknown[];
    warnings?: string[];
  },
): Promise<ImportSummary> {
  const monsterBatch = parseMonsterBatch(input.monsters);
  const skillBatch = parseSkillBatch(input.skills);
  const englishBatch = parseSkillBatch(input.skillsEn ?? []);
  const errors = [
    ...(input.warnings ?? []),
    ...monsterBatch.errors,
    ...skillBatch.errors,
    ...englishBatch.errors,
  ];
  const monsterTotal = input.monsters.length;
  const skillTotal = input.skills.length;
  if (
    monsterBatch.records.length === 0 ||
    skillBatch.records.length === 0 ||
    monsterBatch.errors.length > Math.max(50, monsterTotal * 0.02) ||
    skillBatch.errors.length > Math.max(50, skillTotal * 0.02)
  ) {
    return {
      revision: input.revision,
      added: 0,
      updated: 0,
      unchanged: 0,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      skillCount: 0,
      status: "validation_failed",
    };
  }

  const now = new Date().toISOString();
  const englishById = new Map(englishBatch.records.map((record) => [record.id, record]));
  const skillRows = skillBatch.records.map((record) =>
    mapSkill(record, englishById.get(record.id), input.revision, now),
  );
  const monsterRows = monsterBatch.records.map((record) =>
    mapMonster(record, input.revision, now),
  );
  const existing = await db
    .select({ monsterId: monsters.monsterId, rawData: monsters.rawData })
    .from(monsters);
  const existingRaw = new Map(existing.map((row) => [row.monsterId, row.rawData]));
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  const changedMonsters: MonsterInsert[] = [];
  for (const row of monsterRows) {
    if (row.monsterId === undefined) {
      continue;
    }
    const previous = existingRaw.get(row.monsterId);
    if (previous === undefined) {
      added += 1;
      changedMonsters.push(row);
    } else if (previous === row.rawData) {
      unchanged += 1;
    } else {
      updated += 1;
      changedMonsters.push(row);
    }
  }

  const sourceRows = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(sql`${dataSources.sourceName} = ${dataSource.name}`)
    .limit(1);
  const sourceId = sourceRows[0]?.id;
  if (!sourceId) {
    throw new Error("data_sources 沒有 PADDashFormation 設定，請先執行 db:migrate");
  }

  const run = await db
    .insert(importRuns)
    .values({
      sourceId,
      sourceRevision: input.revision ?? "unknown",
      startedAt: now,
      status: "running",
    })
    .returning({ id: importRuns.id });
  const runId = run[0]?.id;
  if (!runId) {
    throw new Error("無法建立匯入紀錄");
  }

  try {
    await db.transaction(async (tx) => {
      await upsertSkills(tx, skillRows);
      await upsertMonsters(tx, changedMonsters);
      await replaceRelations(tx, monsterBatch.records, skillBatch.records, input.revision);
    });
    await db
      .update(importRuns)
      .set({
        completedAt: new Date().toISOString(),
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        addedCount: added,
        updatedCount: updated,
        unchangedCount: unchanged,
        errorCount: errors.length,
        summaryJson: JSON.stringify({ skillCount: skillRows.length, errors: errors.slice(0, 20) }),
      })
      .where(sql`${importRuns.id} = ${runId}`);
    await db
      .update(dataSources)
      .set({
        latestImportedRevision: input.revision,
        lastSuccessfulImportAt: new Date().toISOString(),
        status: "imported",
      })
      .where(sql`${dataSources.id} = ${sourceId}`);
  } catch (error) {
    await db
      .update(importRuns)
      .set({
        completedAt: new Date().toISOString(),
        status: "failed",
        errorCount: errors.length + 1,
        summaryJson: JSON.stringify({
          message: error instanceof Error ? error.message : "unknown import error",
        }),
      })
      .where(sql`${importRuns.id} = ${runId}`);
    throw error;
  }

  return {
    revision: input.revision,
    added,
    updated,
    unchanged,
    errorCount: errors.length,
    errors: errors.slice(0, 20),
    skillCount: skillRows.length,
    status: errors.length > 0 ? "completed" : "completed",
  };
}

async function upsertSkills(
  db: Pick<LibSQLDatabase, "insert">,
  rows: SkillInsert[],
) {
  for (const chunk of chunks(rows, CHUNK)) {
    await db
      .insert(skills)
      .values(chunk)
      .onConflictDoUpdate({
        target: skills.skillId,
        set: {
          name: sql`excluded.name`,
          nameJa: sql`excluded.name_ja`,
          nameEn: sql`excluded.name_en`,
          description: sql`excluded.description`,
          descriptionJa: sql`excluded.description_ja`,
          descriptionEn: sql`excluded.description_en`,
          skillType: sql`excluded.skill_type`,
          maxLevel: sql`excluded.max_level`,
          initialCooldown: sql`excluded.initial_cooldown`,
          unknownField: sql`excluded.unknown_field`,
          paramsJson: sql`excluded.params_json`,
          rawData: sql`excluded.raw_data`,
          sourceRevision: sql`excluded.source_revision`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }
}

async function upsertMonsters(
  db: Pick<LibSQLDatabase, "insert">,
  rows: MonsterInsert[],
) {
  for (const chunk of chunks(rows, CHUNK)) {
    await db
      .insert(monsters)
      .values(chunk)
      .onConflictDoUpdate({
        target: monsters.monsterId,
        set: {
          name: sql`excluded.name`,
          nameJa: sql`excluded.name_ja`,
          nameEn: sql`excluded.name_en`,
          nameKo: sql`excluded.name_ko`,
          nameCht: sql`excluded.name_cht`,
          nameChs: sql`excluded.name_chs`,
          attributePrimary: sql`excluded.attribute_primary`,
          attributeSecondary: sql`excluded.attribute_secondary`,
          attributeTertiary: sql`excluded.attribute_tertiary`,
          typesJson: sql`excluded.types_json`,
          rarity: sql`excluded.rarity`,
          cost: sql`excluded.cost`,
          maxLevel: sql`excluded.max_level`,
          feedExp: sql`excluded.feed_exp`,
          sellPrice: sql`excluded.sell_price`,
          sellMp: sql`excluded.sell_mp`,
          isUltEvo: sql`excluded.is_ult_evo`,
          isEmpty: sql`excluded.is_empty`,
          enabled: sql`excluded.enabled`,
          canAssist: sql`excluded.can_assist`,
          stackable: sql`excluded.stackable`,
          is8Latent: sql`excluded.is_8_latent`,
          skillBanner: sql`excluded.skill_banner`,
          hpMin: sql`excluded.hp_min`,
          hpMax: sql`excluded.hp_max`,
          hpScale: sql`excluded.hp_scale`,
          atkMin: sql`excluded.atk_min`,
          atkMax: sql`excluded.atk_max`,
          atkScale: sql`excluded.atk_scale`,
          rcvMin: sql`excluded.rcv_min`,
          rcvMax: sql`excluded.rcv_max`,
          rcvScale: sql`excluded.rcv_scale`,
          expMax: sql`excluded.exp_max`,
          expScale: sql`excluded.exp_scale`,
          activeSkillId: sql`excluded.active_skill_id`,
          leaderSkillId: sql`excluded.leader_skill_id`,
          evoBaseId: sql`excluded.evo_base_id`,
          evoRootId: sql`excluded.evo_root_id`,
          evoMaterialsJson: sql`excluded.evo_materials_json`,
          unevoMaterialsJson: sql`excluded.unevo_materials_json`,
          awakeningsJson: sql`excluded.awakenings_json`,
          superAwakeningsJson: sql`excluded.super_awakenings_json`,
          seriesId: sql`excluded.series_id`,
          collabId: sql`excluded.collab_id`,
          latentAwakeningId: sql`excluded.latent_awakening_id`,
          limitBreakIncr: sql`excluded.limit_break_incr`,
          voiceId: sql`excluded.voice_id`,
          orbSkinOrBgmId: sql`excluded.orb_skin_or_bgm_id`,
          specialAttribute: sql`excluded.special_attribute`,
          searchFlagsJson: sql`excluded.search_flags_json`,
          gachaGroupsFlag: sql`excluded.gacha_groups_flag`,
          badgeId: sql`excluded.badge_id`,
          flags: sql`excluded.flags`,
          altNamesJson: sql`excluded.alt_names_json`,
          tagsJson: sql`excluded.tags_json`,
          rawData: sql`excluded.raw_data`,
          sourceRevision: sql`excluded.source_revision`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }
}

async function replaceRelations(
  db: Pick<LibSQLDatabase, "insert" | "delete">,
  monsterRecords: ReturnType<typeof parseMonsterBatch>["records"],
  skillRecords: ReturnType<typeof parseSkillBatch>["records"],
  revision: string | null,
) {
  const skillIds = new Set(skillRecords.map((record) => record.id));
  const monsterIds = new Set(monsterRecords.map((record) => record.id));
  const ids = [...monsterIds];
  const importedSkillIds = [...skillIds];
  for (const chunk of chunks(importedSkillIds, 400)) {
    await db.delete(skillEffects).where(inArray(skillEffects.skillId, chunk));
  }
  for (const chunk of chunks(ids, 400)) {
    await db.delete(monsterSkills).where(inArray(monsterSkills.monsterId, chunk));
    await db
      .delete(monsterAwakenings)
      .where(inArray(monsterAwakenings.monsterId, chunk));
    await db.delete(evolutions).where(inArray(evolutions.toMonsterId, chunk));
  }

  const effectRows = skillRecords.flatMap((record) =>
    classifySkill({
      type: record.type,
      description: record.description,
      params: record.params,
    }).map((effect) => ({
      skillId: record.id,
      effectCategory: effect.effectCategory,
      effectCode: effect.effectCode,
      valueJson: effect.valueJson,
      duration: effect.duration,
      target: effect.target,
      conditionsJson: null,
      rawEffectText: effect.rawEffectText,
      parserVersion: effect.parserVersion,
      parseStatus: effect.parseStatus,
    })),
  );
  for (const chunk of chunks(effectRows, 200)) {
    await db.insert(skillEffects).values(chunk);
  }

  const skillLinks = monsterRecords.flatMap((record) => {
    const links: { monsterId: number; skillId: number; slotType: "active" | "leader"; sortOrder: number }[] = [];
    if (record.activeSkillId > 0 && skillIds.has(record.activeSkillId)) {
      links.push({
        monsterId: record.id,
        skillId: record.activeSkillId,
        slotType: "active",
        sortOrder: 0,
      });
    }
    if (record.leaderSkillId > 0 && skillIds.has(record.leaderSkillId)) {
      links.push({
        monsterId: record.id,
        skillId: record.leaderSkillId,
        slotType: "leader",
        sortOrder: 0,
      });
    }
    return links;
  });
  for (const chunk of chunks(skillLinks, 200)) {
    await db.insert(monsterSkills).values(chunk);
  }

  const awakeningLinks = monsterRecords.flatMap((record) => [
    ...record.awakenings.map((code, position) => ({
      monsterId: record.id,
      awakeningCode: code,
      awakeningType: "normal" as const,
      position,
    })),
    ...record.superAwakenings.map((code, position) => ({
      monsterId: record.id,
      awakeningCode: code,
      awakeningType: "super" as const,
      position,
    })),
  ]);
  for (const chunk of chunks(awakeningLinks, 200)) {
    await db.insert(monsterAwakenings).values(chunk);
  }

  const edges = monsterRecords.flatMap((record) => {
    const edge = evolutionEdge(record);
    if (!edge || !monsterIds.has(edge.fromMonsterId)) {
      return [];
    }
    return [
      {
        fromMonsterId: edge.fromMonsterId,
        toMonsterId: edge.toMonsterId,
        evolutionType: edge.evolutionType,
        materialsJson: JSON.stringify(edge.materials),
        sourceRevision: revision,
      },
    ];
  });
  for (const chunk of chunks(edges, 200)) {
    await db.insert(evolutions).values(chunk);
  }
}

function chunks<T>(items: T[], size: number) {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}
