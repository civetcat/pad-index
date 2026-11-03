import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { decryptIosc } from "./decrypt-iosc.ts";

type Stage = {
  stageId: number;
  dungeonId: number;
  floorId: number;
  waves: string[];
  speakers: Array<{ monsterId: number; name: string; monsterName?: string | null }>;
  messages: string[];
  skillCharges: Array<{ bits: number; turns: number }>;
  bossAlertOff: boolean;
};

const stages = JSON.parse(readFileSync("data/dungeons/stages.json", "utf8")) as Stage[];
const boilerplate = /ダンジョン開始時|常駐スパイン|LoadGrp は無視|バトル\d|名前変える|名前変更|ハンドル番号|オフセット|指定ボス|導入テキスト|パーティーを|param |bgm_|フラッシュ|dlse/;
const notes = new Map<number, string[]>();
const files = readdirSync("data/pad-data-files/mon2").filter((name) => /^st_\d+\.txt$/.test(name));
for (const name of files) {
  const stageId = Number(name.match(/st_(\d+)\.txt/)?.[1]);
  const dungeonId = Math.floor(stageId / 1000);
  const text = decryptIosc(readFileSync(`data/pad-data-files/mon2/${name}`)).toString("utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^\/\/\s*/, "").replace(/\s+/g, " ");
    if (!/[\u3040-\u30ff\u4e00-\u9fff]/.test(line) || boilerplate.test(line) || line.length > 40) {
      continue;
    }
    if (line.startsWith("^") || line.startsWith("#") || line.startsWith("-")) {
      continue;
    }
    if (/第\d+話|編 |プロローグ|スペダン|物語/.test(line)) {
      const list = notes.get(dungeonId) ?? [];
      if (!list.includes(line)) {
        list.push(line);
      }
      notes.set(dungeonId, list);
    }
  }
}

const catalog = [...new Set(stages.map((stage) => stage.dungeonId))]
  .sort((left, right) => left - right)
  .map((dungeonId) => {
    const floors = stages.filter((stage) => stage.dungeonId === dungeonId);
    const floorIds = [...new Set(floors.map((floor) => floor.floorId))].sort((left, right) => left - right);
    return {
      dungeonId,
      source: "mon2/st_*.txt",
      stages: floors.length,
      floorIds,
      titles: notes.get(dungeonId) ?? [],
      firstMessage: floors.find((floor) => floor.messages.length > 0)?.messages[0] ?? null,
      speakers: [...new Map(floors.flatMap((floor) => floor.speakers).map((speaker) => [`${speaker.monsterId}:${speaker.name}`, speaker])).values()],
    };
  });
writeFileSync("data/dungeons/catalog.json", JSON.stringify(catalog, null, 2));
const titled = catalog.filter((dungeon) => dungeon.titles.length > 0);
console.log(JSON.stringify({
  dungeons: catalog.length,
  titled: titled.length,
  titledSample: titled.map((dungeon) => ({ dungeonId: dungeon.dungeonId, titles: dungeon.titles.slice(0, 4), stages: dungeon.stages })),
  untitledSample: catalog.filter((dungeon) => dungeon.titles.length === 0).slice(0, 6).map((dungeon) => ({
    dungeonId: dungeon.dungeonId,
    stages: dungeon.stages,
    floors: dungeon.floorIds.length,
    firstMessage: dungeon.firstMessage,
  })),
}, null, 2));
