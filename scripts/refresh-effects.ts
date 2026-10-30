import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { classifySkill } from "../src/lib/skills/classify";

const accountId = "6370a89f205df8b99e197de070228ac1";
const databaseId = "e0d8f178-bf7d-4094-8733-011718884ccd";
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
const progressPath = "data/d1-effects-v2-progress.txt";
const local = createClient({ url: "file:./data/pad.sqlite" });

mkdirSync("data", { recursive: true });
const done = new Set(
  existsSync(progressPath) ? readFileSync(progressPath, "utf8").split(/\r?\n/).filter(Boolean) : [],
);

type Statement = { sql: string; params: unknown[] };
let cachedToken: { value: string; at: number } | undefined;

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

async function send(statements: Statement[], attempt = 0): Promise<void> {
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
    throw new Error(`${response.status} ${text.slice(0, 400)}`);
  }
}

const skills = await local.execute(
  "SELECT skill_id, skill_type, description, params_json FROM skills",
);
const rows = skills.rows.flatMap((row) => {
  let params: unknown[] = [];
  try {
    const parsed = JSON.parse(String(row.params_json ?? "[]")) as unknown;
    params = Array.isArray(parsed) ? parsed : [];
  } catch {
    params = [];
  }
  return classifySkill({
    type: Number(row.skill_type ?? -1),
    description: String(row.description ?? ""),
    params,
  }).map((effect) => ({
    skillId: Number(row.skill_id),
    effect,
  }));
});
console.log(`classified ${rows.length} effects from ${skills.rows.length} skills`);

await local.execute("DELETE FROM skill_effects");
for (let index = 0; index < rows.length; index += 200) {
  const slice = rows.slice(index, index + 200);
  const placeholders = slice.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  const args = slice.flatMap(({ skillId, effect }) => [
    skillId,
    effect.effectCategory,
    effect.effectCode,
    effect.valueJson,
    effect.duration,
    effect.target,
    null,
    effect.rawEffectText,
    effect.parserVersion,
    effect.parseStatus,
  ]);
  await local.execute({
    sql: `INSERT INTO skill_effects (skill_id, effect_category, effect_code, value_json, duration, target, conditions_json, raw_effect_text, parser_version, parse_status) VALUES ${placeholders}`,
    args,
  });
}
console.log("local skill_effects replaced");

if (!done.has("deleted")) {
  await send([{ sql: "DELETE FROM skill_effects", params: [] }]);
  appendFileSync(progressPath, "deleted\n");
  done.add("deleted");
}

const insertSql =
  "INSERT INTO skill_effects (skill_id, effect_category, effect_code, value_json, duration, target, conditions_json, raw_effect_text, parser_version, parse_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
const chunkSize = 25;
let finished = 0;
const pending: number[] = [];
for (let index = 0; index < rows.length; index += chunkSize) {
  if (!done.has(`chunk:${index}`)) {
    pending.push(index);
  } else {
    finished += 1;
  }
}
console.log(`d1 chunks ${pending.length}`);
let cursor = 0;
async function worker() {
  while (cursor < pending.length) {
    const index = pending[cursor];
    cursor += 1;
    if (index === undefined) {
      return;
    }
    const slice = rows.slice(index, index + chunkSize);
    await send(
      slice.map(({ skillId, effect }) => ({
        sql: insertSql,
        params: [
          skillId,
          effect.effectCategory,
          effect.effectCode,
          effect.valueJson,
          effect.duration,
          effect.target,
          null,
          effect.rawEffectText,
          effect.parserVersion,
          effect.parseStatus,
        ],
      })),
    );
    appendFileSync(progressPath, `chunk:${index}\n`);
    finished += 1;
    if (finished % 40 === 0) {
      console.log(`d1 ${finished}`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));
local.close();
console.log("effects refresh finished", rows.length);
