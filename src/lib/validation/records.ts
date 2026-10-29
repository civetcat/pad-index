import { z } from "zod";

const statCurveSchema = z.object({
  min: z.number(),
  max: z.number(),
  scale: z.number(),
});

export const monsterRecordSchema = z
  .object({
    id: z.number().int().nonnegative(),
    name: z.string(),
    attrs: z.array(z.number().int()),
    types: z.array(z.number().int()),
    isUltEvo: z.boolean(),
    rarity: z.number().int(),
    cost: z.number().int(),
    maxLevel: z.number().int(),
    feedExp: z.number(),
    isEmpty: z.boolean(),
    sellPrice: z.number().int(),
    hp: statCurveSchema,
    atk: statCurveSchema,
    rcv: statCurveSchema,
    exp: statCurveSchema,
    activeSkillId: z.number().int().nonnegative(),
    leaderSkillId: z.number().int().nonnegative(),
    evoBaseId: z.number().int().nonnegative(),
    evoMaterials: z.array(z.number().int().nonnegative()),
    unevoMaterials: z.array(z.number().int().nonnegative()),
    awakenings: z.array(z.number().int()),
    superAwakenings: z.array(z.number().int()),
    evoRootId: z.number().int().nonnegative(),
    seriesId: z.number().int(),
    sellMP: z.number().int(),
    latentAwakeningId: z.number().int(),
    collabId: z.number().int(),
    flags: z.number().int(),
    canAssist: z.boolean(),
    enabled: z.boolean(),
    stackable: z.boolean(),
    is8Latent: z.boolean(),
    skillBanner: z.boolean(),
    altName: z.array(z.string()),
    limitBreakIncr: z.number(),
    voiceId: z.number().int(),
    orbSkinOrBgmId: z.number().int(),
    specialAttribute: z.string(),
    searchFlags: z.array(z.number().int()),
    gachaGroupsFlag: z.number().int(),
    badgeId: z.number().int(),
    otLangName: z
      .object({
        cht: z.string().optional(),
        chs: z.string().optional(),
        en: z.string().optional(),
        ko: z.string().optional(),
      })
      .optional(),
    otTags: z.array(z.string()).optional(),
  })
  .passthrough();

export const skillRecordSchema = z
  .object({
    id: z.number().int().nonnegative(),
    name: z.string(),
    description: z.string(),
    type: z.number().int(),
    maxLevel: z.number().int(),
    initialCooldown: z.number().int(),
    unk: z.string(),
    params: z.array(z.unknown()),
  })
  .passthrough();

export type MonsterRecord = z.infer<typeof monsterRecordSchema>;
export type SkillRecord = z.infer<typeof skillRecordSchema>;
