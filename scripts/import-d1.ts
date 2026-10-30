import { appendFileSync, createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient, type InValue } from "@libsql/client";

const accountId = "6370a89f205df8b99e197de070228ac1";
const databaseId = "e0d8f178-bf7d-4094-8733-011718884ccd";
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
const progressPath = "data/d1-import-progress.txt";
const concurrency = 8;
const local = createClient({ url: "file:./data/pad.sqlite" });

mkdirSync("data", { recursive: true });
const log = createWriteStream("data/d1-import.log", { flags: "a" });
const done = new Set(
  existsSync(progressPath)
    ? readFileSync(progressPath, "utf8").split(/\r?\n/).filter(Boolean)
    : [],
);

type Statement = { sql: string; params: unknown[] };
type Chunk = { key: string; first: number; last: number };

let cachedToken: { value: string; at: number } | undefined;
let stopReason: string | undefined;

function info(message: string) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  log.write(`${line}\n`);
}

function mark(key: string) {
  if (done.has(key)) {
    return;
  }
  done.add(key);
  appendFileSync(progressPath, `${key}\n`);
}

async function authToken() {
  if (cachedToken && Date.now() - cachedToken.at < 30_000) {
    return cachedToken.value;
  }
  const tokenModule = await import(
    pathToFileURL(path.resolve("node_modules/cf/dist/auth-token-DvNoIhRL.mjs")).href
  );
  const value = await tokenModule.t();
  if (typeof value !== "string" || value.length < 20) {
    throw new Error("Cloudflare login expired. Run: corepack pnpm exec cf auth login");
  }
  cachedToken = { value, at: Date.now() };
  return value;
}

function bind(value: unknown) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString("utf8");
  }
  return value ?? null;
}

function isQuota(text: string) {
  return /daily|quota|rows written|limit exceeded/i.test(text) && !/too many SQL variables/i.test(text);
}

function isSplit(text: string) {
  return /too many SQL variables|too many terms|statement too long|request entity too large|payload/i.test(text);
}

async function send(statements: Statement[], attempt = 0): Promise<void> {
  if (stopReason) {
    throw new Error(stopReason);
  }
  const token = await authToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batch: statements }),
  });
  const text = await response.text();
  if (response.status === 401 && attempt < 2) {
    cachedToken = undefined;
    await send(statements, attempt + 1);
    return;
  }
  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
    await send(statements, attempt + 1);
    return;
  }
  if (!response.ok || text.includes('"success":false') || text.includes('"success": false')) {
    if (isQuota(text)) {
      stopReason = text.slice(0, 400);
    }
    throw new Error(`${response.status} ${text.slice(0, 500)}`);
  }
}

async function scalar(sql: string) {
  const token = await authToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${text.slice(0, 400)}`);
  }
  const parsed = JSON.parse(text) as {
    result?: { results?: Record<string, number | null>[] }[];
  };
  return parsed.result?.[0]?.results?.[0] ?? {};
}

async function ids(table: string, idColumn: string, where = "1 = 1") {
  const result = await local.execute(
    `SELECT ${idColumn} AS id FROM ${table} WHERE ${where} ORDER BY ${idColumn}`,
  );
  return result.rows.map((row) => Number(row.id));
}

function chunksFor(prefix: string, values: number[], size: number) {
  const chunks: Chunk[] = [];
  for (let index = 0; index < values.length; index += size) {
    const slice = values.slice(index, index + size);
    const first = slice[0];
    const last = slice[slice.length - 1];
    if (first === undefined || last === undefined) {
      continue;
    }
    chunks.push({ key: `${prefix}:${first}-${last}`, first, last });
  }
  return chunks;
}

async function runChunks(
  label: string,
  chunks: Chunk[],
  work: (chunk: Chunk) => Promise<Statement[]>,
) {
  const pending = chunks.filter((chunk) => !done.has(chunk.key));
  info(`${label} chunks ${pending.length}/${chunks.length}`);
  let finished = chunks.length - pending.length;
  let cursor = 0;
  async function worker() {
    while (!stopReason) {
      const index = cursor;
      cursor += 1;
      const chunk = pending[index];
      if (!chunk) {
        return;
      }
      const statements = await work(chunk);
      if (statements.length === 0) {
        mark(chunk.key);
        continue;
      }
      try {
        await send(statements);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (statements.length > 1 && isSplit(message)) {
          const midpoint = Math.ceil(statements.length / 2);
          await send(statements.slice(0, midpoint));
          await send(statements.slice(midpoint));
        } else {
          info(`${label} failed ${chunk.key} ${message}`);
          throw error;
        }
      }
      mark(chunk.key);
      finished += 1;
      if (finished % 25 === 0 || finished === chunks.length) {
        info(`${label} ${finished}/${chunks.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length || 1) }, () => worker()));
}

async function loadRange(table: string, columns: string[], idColumn: string, chunk: Chunk) {
  const result = await local.execute({
    sql: `SELECT ${columns.join(", ")} FROM ${table} WHERE ${idColumn} >= ? AND ${idColumn} <= ?`,
    args: [chunk.first, chunk.last] as InValue[],
  });
  return result.rows as Record<string, unknown>[];
}

async function copyTable(options: {
  label: string;
  table: string;
  idColumn: string;
  columns: string[];
  where?: string;
  chunkSize: number;
  sql: string;
}) {
  const values = await ids(options.table, options.idColumn, options.where);
  const chunks = chunksFor(options.label, values, options.chunkSize);
  await runChunks(options.label, chunks, async (chunk) => {
    const rows = await loadRange(options.table, options.columns, options.idColumn, chunk);
    return rows.map((row) => ({
      sql: options.sql,
      params: options.columns.map((column) => bind(row[column])),
    }));
  });
}

const monsterColumns = [
  "monster_id", "name", "name_ja", "name_en", "name_ko", "name_cht", "name_chs",
  "attribute_primary", "attribute_secondary", "attribute_tertiary", "types_json",
  "rarity", "cost", "max_level", "feed_exp", "sell_price", "sell_mp", "is_ult_evo",
  "is_empty", "enabled", "can_assist", "stackable", "is_8_latent", "skill_banner",
  "hp_min", "hp_max", "hp_scale", "atk_min", "atk_max", "atk_scale", "rcv_min",
  "rcv_max", "rcv_scale", "exp_max", "exp_scale", "active_skill_id", "leader_skill_id",
  "evo_base_id", "evo_root_id", "evo_materials_json", "unevo_materials_json",
  "awakenings_json", "super_awakenings_json", "series_id", "collab_id",
  "latent_awakening_id", "limit_break_incr", "voice_id", "orb_skin_or_bgm_id",
  "special_attribute", "search_flags_json", "gacha_groups_flag", "badge_id", "flags",
  "alt_names_json", "tags_json", "raw_data", "source_revision", "created_at", "updated_at",
];
const backfillColumns = [
  "name_ko", "name_chs", "attribute_primary", "attribute_secondary", "attribute_tertiary",
  "feed_exp", "sell_price", "sell_mp", "is_ult_evo", "can_assist", "stackable",
  "is_8_latent", "skill_banner", "hp_min", "hp_scale", "atk_min", "atk_scale", "rcv_min",
  "rcv_scale", "exp_max", "exp_scale", "series_id", "collab_id", "latent_awakening_id",
  "limit_break_incr", "voice_id", "orb_skin_or_bgm_id", "special_attribute",
  "search_flags_json", "gacha_groups_flag", "badge_id", "flags", "alt_names_json",
  "tags_json", "monster_id",
];

info("import start");
const before = await scalar("SELECT count(*) AS n FROM monsters");
info(`d1 monsters ${before.n ?? 0}`);

const assignments = backfillColumns
  .filter((column) => column !== "monster_id")
  .map((column) => `${column} = ?`)
  .join(", ");
await copyTable({
  label: "backfill",
  table: "monsters",
  idColumn: "monster_id",
  columns: backfillColumns,
  where: "monster_id <= 7579",
  chunkSize: 30,
  sql: `UPDATE monsters SET ${assignments} WHERE monster_id = ?`,
});

await copyTable({
  label: "monsters",
  table: "monsters",
  idColumn: "monster_id",
  columns: monsterColumns,
  where: "monster_id > 7579",
  chunkSize: 12,
  sql: `INSERT OR REPLACE INTO monsters (${monsterColumns.join(", ")}) VALUES (${monsterColumns.map(() => "?").join(", ")})`,
});

const skillColumns = [
  "skill_id", "name", "name_ja", "name_en", "name_ko", "description", "description_ja",
  "description_en", "description_ko", "skill_type", "max_level", "initial_cooldown",
  "unknown_field", "params_json", "raw_data", "source_revision", "updated_at",
];

await Promise.all([
  copyTable({
    label: "skills",
    table: "skills",
    idColumn: "skill_id",
    columns: skillColumns,
    chunkSize: 20,
    sql: `INSERT OR REPLACE INTO skills (${skillColumns.join(", ")}) VALUES (${skillColumns.map(() => "?").join(", ")})`,
  }),
  copyTable({
    label: "evolutions",
    table: "evolutions",
    idColumn: "id",
    columns: ["id", "from_monster_id", "to_monster_id", "evolution_type", "materials_json", "source_revision"],
    chunkSize: 40,
    sql: "INSERT OR REPLACE INTO evolutions (id, from_monster_id, to_monster_id, evolution_type, materials_json, source_revision) VALUES (?, ?, ?, ?, ?, ?)",
  }),
  copyTable({
    label: "awakenings",
    table: "monster_awakenings",
    idColumn: "id",
    columns: ["id", "monster_id", "awakening_code", "awakening_type", "position"],
    chunkSize: 60,
    sql: "INSERT OR REPLACE INTO monster_awakenings (id, monster_id, awakening_code, awakening_type, position) VALUES (?, ?, ?, ?, ?)",
  }),
]);

await Promise.all([
  copyTable({
    label: "effects",
    table: "skill_effects",
    idColumn: "id",
    columns: [
      "id", "skill_id", "effect_category", "effect_code", "value_json", "duration", "target",
      "conditions_json", "raw_effect_text", "parser_version", "parse_status",
    ],
    chunkSize: 40,
    sql: "INSERT OR REPLACE INTO skill_effects (id, skill_id, effect_category, effect_code, value_json, duration, target, conditions_json, raw_effect_text, parser_version, parse_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  }),
  copyTable({
    label: "links",
    table: "monster_skills",
    idColumn: "rowid",
    columns: ["monster_id", "skill_id", "slot_type", "sort_order"],
    chunkSize: 80,
    sql: "INSERT OR IGNORE INTO monster_skills (monster_id, skill_id, slot_type, sort_order) VALUES (?, ?, ?, ?)",
  }),
]);

const checks = [
  ["monsters", "SELECT count(*) AS n FROM monsters", 14258],
  ["skills", "SELECT count(*) AS n FROM skills", 66891],
  ["monster_skills", "SELECT count(*) AS n FROM monster_skills", 23004],
  ["evolutions", "SELECT count(*) AS n FROM evolutions", 7280],
  ["skill_effects", "SELECT count(*) AS n FROM skill_effects", 80302],
  ["monster_awakenings", "SELECT count(*) AS n FROM monster_awakenings", 107302],
  ["tyrra-attr", "SELECT attribute_primary AS n FROM monsters WHERE monster_id = 1", 0],
] as const;

let failed = false;
for (const [name, sql, expected] of checks) {
  const row = await scalar(sql);
  const actual = row.n;
  info(`check ${name} ${actual} expected ${expected}`);
  if (Number(actual) !== expected) {
    failed = true;
  }
}
local.close();
if (stopReason) {
  info(`stopped ${stopReason}`);
  log.end();
  throw new Error(`D1 write limit: ${stopReason}`);
}
if (failed) {
  info("counts did not match");
  log.end();
  throw new Error("D1 counts do not match the local database");
}
info("import finished");
log.end();
