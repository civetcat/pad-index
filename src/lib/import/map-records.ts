import type { InferInsertModel } from "drizzle-orm";
import type { monsters, skills } from "@/lib/db/schema";
import {
  monsterRecordSchema,
  skillRecordSchema,
  type MonsterRecord,
  type SkillRecord,
} from "@/lib/validation/records";

export type MonsterInsert = InferInsertModel<typeof monsters>;
export type SkillInsert = InferInsertModel<typeof skills>;

export type ParsedBatch<T> = {
  records: T[];
  errors: string[];
};

export function parseMonsterBatch(input: unknown[]): ParsedBatch<MonsterRecord> {
  return parseBatch(input, monsterRecordSchema);
}

export function parseSkillBatch(input: unknown[]): ParsedBatch<SkillRecord> {
  return parseBatch(input, skillRecordSchema);
}

function parseBatch<T>(
  input: unknown[],
  schema: {
    safeParse: (
      value: unknown,
    ) =>
      | { success: true; data: T }
      | { success: false; error: { issues: { message: string }[] } };
  },
): ParsedBatch<T> {
  const records: T[] = [];
  const errors: string[] = [];
  for (const item of input) {
    const parsed = schema.safeParse(item);
    if (!parsed.success) {
      const id = readId(item);
      errors.push(
        `#${id ?? "?"}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
      );
      continue;
    }
    records.push(parsed.data);
  }
  return { records, errors };
}

function readId(value: unknown) {
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = value.id;
    return typeof id === "number" ? id : undefined;
  }
  return undefined;
}

export function mapMonster(
  record: MonsterRecord,
  sourceRevision: string | null,
  now: string,
): MonsterInsert {
  const attrs = record.attrs.filter((value) => value >= 0);
  return {
    monsterId: record.id,
    name: record.name,
    nameJa: record.name,
    nameEn: record.otLangName?.en || null,
    nameKo: record.otLangName?.ko || null,
    nameCht: record.otLangName?.cht || null,
    nameChs: record.otLangName?.chs || null,
    attributePrimary: attrs[0] ?? null,
    attributeSecondary: attrs[1] ?? null,
    attributeTertiary: attrs[2] ?? null,
    typesJson: JSON.stringify(record.types),
    rarity: record.rarity,
    cost: record.cost,
    maxLevel: record.maxLevel,
    feedExp: record.feedExp,
    sellPrice: record.sellPrice,
    sellMp: record.sellMP,
    isUltEvo: record.isUltEvo,
    isEmpty: record.isEmpty,
    enabled: record.enabled,
    canAssist: record.canAssist,
    stackable: record.stackable,
    is8Latent: record.is8Latent,
    skillBanner: record.skillBanner,
    hpMin: record.hp.min,
    hpMax: record.hp.max,
    hpScale: record.hp.scale,
    atkMin: record.atk.min,
    atkMax: record.atk.max,
    atkScale: record.atk.scale,
    rcvMin: record.rcv.min,
    rcvMax: record.rcv.max,
    rcvScale: record.rcv.scale,
    expMax: record.exp.max,
    expScale: record.exp.scale,
    activeSkillId: record.activeSkillId,
    leaderSkillId: record.leaderSkillId,
    evoBaseId: record.evoBaseId,
    evoRootId: record.evoRootId,
    evoMaterialsJson: JSON.stringify(record.evoMaterials),
    unevoMaterialsJson: JSON.stringify(record.unevoMaterials),
    awakeningsJson: JSON.stringify(record.awakenings),
    superAwakeningsJson: JSON.stringify(record.superAwakenings),
    seriesId: record.seriesId,
    collabId: record.collabId,
    latentAwakeningId: record.latentAwakeningId,
    limitBreakIncr: record.limitBreakIncr,
    voiceId: record.voiceId,
    orbSkinOrBgmId: record.orbSkinOrBgmId,
    specialAttribute: record.specialAttribute,
    searchFlagsJson: JSON.stringify(record.searchFlags),
    gachaGroupsFlag: record.gachaGroupsFlag,
    badgeId: record.badgeId,
    flags: record.flags,
    altNamesJson: JSON.stringify(record.altName),
    tagsJson: JSON.stringify(record.otTags ?? []),
    rawData: JSON.stringify(record),
    sourceRevision,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapSkill(
  record: SkillRecord,
  english: SkillRecord | undefined,
  sourceRevision: string | null,
  now: string,
): SkillInsert {
  return {
    skillId: record.id,
    name: record.name,
    nameJa: record.name,
    nameEn: english?.name || null,
    description: record.description,
    descriptionJa: record.description,
    descriptionEn: english?.description || null,
    skillType: record.type,
    maxLevel: record.maxLevel,
    initialCooldown: record.initialCooldown,
    unknownField: record.unk,
    paramsJson: JSON.stringify(record.params),
    rawData: JSON.stringify(record),
    sourceRevision,
    updatedAt: now,
  };
}

export function evolutionEdge(record: MonsterRecord) {
  if (record.evoBaseId === 0) {
    return null;
  }
  return {
    fromMonsterId: record.evoBaseId,
    toMonsterId: record.id,
    evolutionType: record.isUltEvo ? "ultimate" : "standard",
    materials: record.evoMaterials.filter((id) => id > 0),
  };
}

export function materialIds(record: MonsterRecord) {
  return record.evoMaterials.filter((id) => id > 0);
}
