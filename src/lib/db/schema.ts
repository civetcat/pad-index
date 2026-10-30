import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const monsters = sqliteTable(
  "monsters",
  {
    monsterId: integer("monster_id").primaryKey(),
    name: text("name").notNull(),
    nameJa: text("name_ja"),
    nameEn: text("name_en"),
    nameKo: text("name_ko"),
    nameCht: text("name_cht"),
    nameChs: text("name_chs"),
    attributePrimary: integer("attribute_primary"),
    attributeSecondary: integer("attribute_secondary"),
    attributeTertiary: integer("attribute_tertiary"),
    typesJson: text("types_json").notNull(),
    rarity: integer("rarity"),
    cost: integer("cost"),
    maxLevel: integer("max_level"),
    feedExp: integer("feed_exp"),
    sellPrice: integer("sell_price"),
    sellMp: integer("sell_mp"),
    isUltEvo: integer("is_ult_evo", { mode: "boolean" }),
    isEmpty: integer("is_empty", { mode: "boolean" }),
    enabled: integer("enabled", { mode: "boolean" }),
    canAssist: integer("can_assist", { mode: "boolean" }),
    stackable: integer("stackable", { mode: "boolean" }),
    is8Latent: integer("is_8_latent", { mode: "boolean" }),
    skillBanner: integer("skill_banner", { mode: "boolean" }),
    hpMin: integer("hp_min"),
    hpMax: integer("hp_max"),
    hpScale: real("hp_scale"),
    atkMin: integer("atk_min"),
    atkMax: integer("atk_max"),
    atkScale: real("atk_scale"),
    rcvMin: integer("rcv_min"),
    rcvMax: integer("rcv_max"),
    rcvScale: real("rcv_scale"),
    expMax: integer("exp_max"),
    expScale: real("exp_scale"),
    activeSkillId: integer("active_skill_id"),
    leaderSkillId: integer("leader_skill_id"),
    evoBaseId: integer("evo_base_id"),
    evoRootId: integer("evo_root_id"),
    evoMaterialsJson: text("evo_materials_json").notNull(),
    unevoMaterialsJson: text("unevo_materials_json").notNull(),
    awakeningsJson: text("awakenings_json").notNull(),
    superAwakeningsJson: text("super_awakenings_json").notNull(),
    seriesId: integer("series_id"),
    collabId: integer("collab_id"),
    latentAwakeningId: integer("latent_awakening_id"),
    limitBreakIncr: integer("limit_break_incr"),
    voiceId: integer("voice_id"),
    orbSkinOrBgmId: integer("orb_skin_or_bgm_id"),
    specialAttribute: text("special_attribute"),
    searchFlagsJson: text("search_flags_json"),
    gachaGroupsFlag: integer("gacha_groups_flag"),
    badgeId: integer("badge_id"),
    flags: integer("flags"),
    altNamesJson: text("alt_names_json"),
    tagsJson: text("tags_json"),
    rawData: text("raw_data").notNull(),
    sourceRevision: text("source_revision"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("monsters_name_idx").on(table.name),
    index("monsters_rarity_idx").on(table.rarity),
    index("monsters_attribute_primary_idx").on(table.attributePrimary),
    index("monsters_evo_base_idx").on(table.evoBaseId),
    index("monsters_evo_root_idx").on(table.evoRootId),
  ],
);

export const skills = sqliteTable(
  "skills",
  {
    skillId: integer("skill_id").primaryKey(),
    name: text("name").notNull(),
    nameJa: text("name_ja"),
    nameEn: text("name_en"),
    nameKo: text("name_ko"),
    description: text("description").notNull(),
    descriptionJa: text("description_ja"),
    descriptionEn: text("description_en"),
    descriptionKo: text("description_ko"),
    skillType: integer("skill_type"),
    maxLevel: integer("max_level"),
    initialCooldown: integer("initial_cooldown"),
    unknownField: text("unknown_field"),
    paramsJson: text("params_json").notNull(),
    rawData: text("raw_data").notNull(),
    sourceRevision: text("source_revision"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("skills_name_idx").on(table.name),
    index("skills_type_idx").on(table.skillType),
  ],
);

export const monsterSkills = sqliteTable(
  "monster_skills",
  {
    monsterId: integer("monster_id")
      .notNull()
      .references(() => monsters.monsterId),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.skillId),
    slotType: text("slot_type", { enum: ["active", "leader"] }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.monsterId, table.skillId, table.slotType],
    }),
  ],
);

export const awakenings = sqliteTable("awakenings", {
  awakeningCode: integer("awakening_code").primaryKey(),
  name: text("name"),
  description: text("description"),
  rawData: text("raw_data"),
});

export const monsterAwakenings = sqliteTable(
  "monster_awakenings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    monsterId: integer("monster_id")
      .notNull()
      .references(() => monsters.monsterId),
    awakeningCode: integer("awakening_code").notNull(),
    awakeningType: text("awakening_type", {
      enum: ["normal", "super"],
    }).notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    index("monster_awakenings_monster_idx").on(table.monsterId),
    unique("monster_awakenings_position").on(
      table.monsterId,
      table.awakeningType,
      table.position,
    ),
  ],
);

export const evolutions = sqliteTable(
  "evolutions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fromMonsterId: integer("from_monster_id")
      .notNull()
      .references(() => monsters.monsterId),
    toMonsterId: integer("to_monster_id")
      .notNull()
      .references(() => monsters.monsterId),
    evolutionType: text("evolution_type"),
    materialsJson: text("materials_json"),
    sourceRevision: text("source_revision"),
  },
  (table) => [
    unique("evolutions_edge").on(table.fromMonsterId, table.toMonsterId),
    index("evolutions_to_idx").on(table.toMonsterId),
  ],
);

export const dataSources = sqliteTable("data_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceName: text("source_name").notNull().unique(),
  repositoryUrl: text("repository_url").notNull(),
  branch: text("branch").notNull(),
  dataPath: text("data_path").notNull(),
  latestCheckedRevision: text("latest_checked_revision"),
  latestImportedRevision: text("latest_imported_revision"),
  lastCheckedAt: text("last_checked_at"),
  lastSuccessfulImportAt: text("last_successful_import_at"),
  status: text("status").notNull().default("not_imported"),
});

export const skillEffects = sqliteTable(
  "skill_effects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.skillId),
    effectCategory: text("effect_category").notNull(),
    effectCode: text("effect_code"),
    valueJson: text("value_json"),
    duration: integer("duration"),
    target: text("target"),
    conditionsJson: text("conditions_json"),
    rawEffectText: text("raw_effect_text").notNull(),
    parserVersion: text("parser_version").notNull(),
    parseStatus: text("parse_status", {
      enum: ["parsed", "partial", "unparsed"],
    }).notNull(),
  },
  (table) => [
    index("skill_effects_skill_idx").on(table.skillId),
    index("skill_effects_category_idx").on(table.effectCategory),
  ],
);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
});

export const favorites = sqliteTable(
  "favorites",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    monsterId: integer("monster_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.monsterId] })],
);

export const savedTeams = sqliteTable("saved_teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  monsterIdsJson: text("monster_ids_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const upstreamChecks = sqliteTable(
  "upstream_checks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => dataSources.id),
    checkedAt: text("checked_at").notNull(),
    status: text("status").notNull(),
    latestRevision: text("latest_revision"),
    importedRevision: text("imported_revision"),
    summaryJson: text("summary_json"),
    errorMessage: text("error_message"),
  },
  (table) => [index("upstream_checks_source_idx").on(table.sourceId)],
);

export const importRuns = sqliteTable(
  "import_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => dataSources.id),
    sourceRevision: text("source_revision").notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    status: text("status").notNull(),
    addedCount: integer("added_count"),
    updatedCount: integer("updated_count"),
    unchangedCount: integer("unchanged_count"),
    errorCount: integer("error_count"),
    summaryJson: text("summary_json"),
  },
  (table) => [index("import_runs_source_idx").on(table.sourceId)],
);
