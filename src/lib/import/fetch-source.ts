import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataSource } from "@/lib/source";

const headers = {
  "User-Agent": "pad-index",
  Accept: "application/vnd.github+json",
};

export async function fetchSourceRevision(fetchImpl: typeof fetch = fetch) {
  const url = `https://api.github.com/repos/Mapaler/PADDashFormation/commits?path=${dataSource.dataPath}&per_page=1`;
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}`);
  }
  const commits = (await response.json()) as { sha?: string }[];
  return commits[0]?.sha ?? null;
}

export async function downloadSourceFiles(ref: string, fetchImpl: typeof fetch = fetch) {
  const [monsters, skills, skillsEn] = await Promise.all([
    downloadJson(dataSource.files.monstersJa, ref, fetchImpl),
    downloadJson(dataSource.files.skillsJa, ref, fetchImpl),
    downloadJson(dataSource.files.skillsEn, ref, fetchImpl),
  ]);
  return { monsters, skills, skillsEn };
}

export function saveSourceSnapshot(
  ref: string,
  files: Record<string, string>,
) {
  const dir = path.resolve("data/raw", ref);
  mkdirSync(dir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), contents);
  }
}

async function downloadJson(filePath: string, ref: string, fetchImpl: typeof fetch) {
  const url = `https://raw.githubusercontent.com/Mapaler/PADDashFormation/${ref}/${filePath}`;
  const response = await fetchImpl(url, { headers: { "User-Agent": "pad-index" } });
  if (!response.ok) {
    throw new Error(`download failed ${response.status} ${url}`);
  }
  const raw = await response.text();
  return { raw, parsed: JSON.parse(raw) as unknown };
}

export function asJsonArray(value: unknown, name: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} 不是陣列`);
  }
  return value;
}
