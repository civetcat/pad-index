import { existsSync, readFileSync, writeFileSync } from "node:fs";

const sourcePath = process.argv[2] ?? "data/upstream-src/download_dungeon_data.json";

if (!existsSync(sourcePath)) {
  console.log(JSON.stringify({
    ok: false,
    missing: sourcePath,
    need: "Save the download_dungeon_data response from your own client to this path, then run this script again.",
  }, null, 2));
  process.exit(1);
}

type Floor = {
  floorId: number;
  name: string;
  floors: number | null;
  stamina: number | null;
};
type Dungeon = {
  dungeonId: number;
  name: string;
  floors: Floor[];
};

function stripColors(value: string) {
  return value.replace(/\^[0-9A-Fa-f]{6}\^/g, "").replace(/^#G#|^#1#|^#C#|^#Q#/, "").trim();
}

function parseCsv(line: string) {
  const values: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === "`" && (line[i + 1] === "," || line[i + 1] === undefined)) {
        quoted = false;
        continue;
      }
      cell += char;
      continue;
    }
    if (char === "`") {
      quoted = true;
      continue;
    }
    if (char === ",") {
      values.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }
  values.push(cell);
  return values;
}

const raw = JSON.parse(readFileSync(sourcePath, "utf8")) as { dungeons?: string };
if (!raw.dungeons) {
  throw new Error("JSON has no dungeons field");
}

const dungeons: Dungeon[] = [];
let current: Dungeon | null = null;
for (const line of raw.dungeons.split("\n")) {
  if (line.length < 2) {
    continue;
  }
  const kind = line.slice(0, 2);
  const fields = parseCsv(line.slice(2).replace(/',/g, "`,").replace(/,'/g, ",`"));
  if (kind === "d;") {
    current = {
      dungeonId: Number(fields[0]),
      name: stripColors(fields[1] ?? ""),
      floors: [],
    };
    dungeons.push(current);
  } else if (kind === "f;" && current) {
    current.floors.push({
      floorId: Number(fields[0]),
      name: stripColors(fields[1] ?? ""),
      floors: Number(fields[2]) || null,
      stamina: Number(fields[4]) || null,
    });
  }
}

const stageIndex = JSON.parse(readFileSync("data/dungeons/index.json", "utf8")) as Array<{ dungeonId: number }>;
const wanted = new Set(stageIndex.map((row) => row.dungeonId));
const joined = dungeons
  .filter((dungeon) => wanted.has(dungeon.dungeonId))
  .map((dungeon) => ({
    dungeonId: dungeon.dungeonId,
    name: dungeon.name,
    difficulties: dungeon.floors.length,
    stamina: [...new Set(dungeon.floors.map((floor) => floor.stamina).filter((value) => value != null))],
    floors: dungeon.floors,
  }));
writeFileSync("data/dungeons/official-catalog.json", JSON.stringify(joined, null, 2));
console.log(JSON.stringify({
  ok: true,
  sourceDungeons: dungeons.length,
  matched: joined.length,
  missing: [...wanted].filter((id) => !joined.some((dungeon) => dungeon.dungeonId === id)).slice(0, 20),
  sample: joined.slice(0, 3),
}, null, 2));
