import { readFileSync, writeFileSync } from "node:fs";
import { decryptIosc } from "./decrypt-iosc.ts";

const commit = "86c607578c06a323c9d56266ce5c8388c32d3b09";
const paths = readFileSync("data/info-files.txt", "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

async function load(path: string) {
  const url = `https://raw.githubusercontent.com/Mapaler/Puzzle-and-Dragons-Data-Files/${commit}/${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${path}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  const text = decryptIosc(data).toString("utf8").replace(/\r/g, "").trim();
  const waves = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [body, comment] = line.split(";").map((part) => part?.trim());
      const [kind, value] = (body ?? "").split(/\s+/);
      return { kind, value: value ?? null, comment: comment ?? null };
    });
  return { file: path.split("/").pop(), waves };
}

const results = [];
let failed = 0;
for (let i = 0; i < paths.length; i += 12) {
  const batch = paths.slice(i, i + 12);
  const settled = await Promise.allSettled(batch.map((path) => load(path)));
  for (const item of settled) {
    if (item.status === "fulfilled") {
      results.push(item.value);
    } else {
      failed += 1;
      if (failed <= 3) {
        console.log("fail", item.reason instanceof Error ? item.reason.message : item.reason);
      }
    }
  }
}
results.sort((left, right) => (left.file ?? "").localeCompare(right.file ?? ""));
writeFileSync("data/dungeons/backgrounds.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify({
  files: paths.length,
  decrypted: results.length,
  failed,
  sample: results.slice(0, 2),
}, null, 2));
