import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { decryptIosc } from "./decrypt-iosc.ts";

function cleanText(value: string) {
  return value
    .replace(/\^[A-Za-z0-9]{1,8}/g, "")
    .replace(/\^[0-9A-Fa-f]{6}\^/g, "")
    .replace(/^["「]|["」]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type Speaker = { monsterId: number; name: string };
type Stage = {
  stageId: number;
  dungeonId: number;
  floorId: number;
  waves: string[];
  speakers: Speaker[];
  messages: string[];
  skillCharges: Array<{ bits: number; turns: number }>;
  bossAlertOff: boolean;
};

const files = readdirSync("data/pad-data-files/mon2").filter((name) => /^st_\d+\.txt$/.test(name));
const stages: Stage[] = [];
let failed = 0;
let otherJapanese = 0;

for (const name of files) {
  const stageId = Number(name.match(/st_(\d+)\.txt/)?.[1]);
  try {
    const text = decryptIosc(readFileSync(`data/pad-data-files/mon2/${name}`)).toString("utf8");
    const waves: string[] = [];
    const speakers: Speaker[] = [];
    const messages: string[] = [];
    const skillCharges: Array<{ bits: number; turns: number }> = [];
    let bossAlertOff = false;
    const seenSpeakers = new Set<string>();
    const seenMessages = new Set<string>();

    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) {
        continue;
      }
      const textMark = line.match(/^#Text\s+(\S+)/i);
      if (textMark?.[1]) {
        waves.push(textMark[1]);
        continue;
      }
      const speaker = line.match(/^#name\s+mons(\d+)\s+"?([^"/\t]+?)"?\s*(?:\/\/|$)/i);
      if (speaker?.[1] && speaker[2]) {
        const monsterId = Number(speaker[1]);
        const speakerName = cleanText(speaker[2]);
        const key = `${monsterId}:${speakerName}`;
        if (speakerName && speakerName !== "CLEAR" && !seenSpeakers.has(key)) {
          seenSpeakers.add(key);
          speakers.push({ monsterId, name: speakerName });
        }
        continue;
      }
      const charge = line.match(/^#Game\s+SkillCharge\s+bit\s+(\d+)\s+(\d+)/i);
      if (charge?.[1] && charge[2]) {
        skillCharges.push({ bits: Number(charge[1]), turns: Number(charge[2]) });
        continue;
      }
      if (/^#Game\s+BossAlertOff/i.test(line)) {
        bossAlertOff = true;
        continue;
      }
      if (line.startsWith("#")) {
        continue;
      }
      if (!/[\u3040-\u30ff\u4e00-\u9fff]/.test(line)) {
        continue;
      }
      const message = cleanText(line);
      if (!message) {
        continue;
      }
      if (!line.startsWith("^")) {
        otherJapanese += 1;
      }
      if (!seenMessages.has(message)) {
        seenMessages.add(message);
        messages.push(message);
      }
    }

    stages.push({
      stageId,
      dungeonId: Math.floor(stageId / 1000),
      floorId: stageId % 1000,
      waves,
      speakers,
      messages,
      skillCharges,
      bossAlertOff,
    });
  } catch {
    failed += 1;
  }
}

stages.sort((left, right) => left.stageId - right.stageId);
const speakerIds = [...new Set(stages.flatMap((stage) => stage.speakers.map((speaker) => speaker.monsterId)))];
const monsterNames = new Map<number, string>();
if (speakerIds.length > 0) {
  const local = createClient({ url: "file:./data/pad.sqlite" });
  const rows = await local.execute({
    sql: `select monster_id, coalesce(name_ja, name) as name from monsters where monster_id in (${speakerIds.map(() => "?").join(",")})`,
    args: speakerIds,
  });
  await local.close();
  for (const row of rows.rows) {
    monsterNames.set(Number(row.monster_id), String(row.name));
  }
}
for (const stage of stages) {
  for (const speaker of stage.speakers) {
    speaker.monsterName = monsterNames.get(speaker.monsterId) ?? null;
  }
}
const dungeonIndex = [...new Set(stages.map((stage) => stage.dungeonId))]
  .sort((left, right) => left - right)
  .map((dungeonId) => {
    const floors = stages.filter((stage) => stage.dungeonId === dungeonId);
    return {
      dungeonId,
      stages: floors.length,
      speakers: [...new Map(floors.flatMap((floor) => floor.speakers).map((speaker) => [`${speaker.monsterId}:${speaker.name}`, speaker])).values()],
      messages: floors.reduce((sum, floor) => sum + floor.messages.length, 0),
      firstMessage: floors.find((floor) => floor.messages.length > 0)?.messages[0] ?? null,
    };
  });
mkdirSync("data/dungeons", { recursive: true });
writeFileSync("data/dungeons/stages.json", JSON.stringify(stages, null, 2));
writeFileSync("data/dungeons/index.json", JSON.stringify(dungeonIndex, null, 2));

const withMessages = stages.filter((stage) => stage.messages.length > 0);
const withSpeakers = stages.filter((stage) => stage.speakers.length > 0);
const dungeons = new Set(stages.map((stage) => stage.dungeonId));
const story = stages.find((stage) => stage.speakers.some((speaker) => speaker.name === "ピエ"));
const modifier = stages.find((stage) => stage.stageId === 100001);
console.log(JSON.stringify({
  files: files.length,
  decrypted: stages.length,
  failed,
  dungeons: dungeons.size,
  withMessages: withMessages.length,
  withSpeakers: withSpeakers.length,
  messages: stages.reduce((sum, stage) => sum + stage.messages.length, 0),
  speakers: stages.reduce((sum, stage) => sum + stage.speakers.length, 0),
  otherJapanese,
  modifier,
  story: story
    ? {
        stageId: story.stageId,
        dungeonId: story.dungeonId,
        floorId: story.floorId,
        speakers: story.speakers,
        messages: story.messages.slice(0, 8),
      }
    : null,
}, null, 2));
