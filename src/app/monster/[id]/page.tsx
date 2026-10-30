import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AttributePips } from "@/components/monster/attribute-pips";
import { AwakeningPicker } from "@/components/monster/awakening-picker";
import { SkillText } from "@/components/monster/skill-text";
import { MonsterCardArt } from "@/components/monster/monster-card-art";
import { MonsterPortrait } from "@/components/monster/monster-portrait";
import { getAppDatabase } from "@/lib/db/app-db";
import { displayMonsterName, labelOrUnknown, typeLabels } from "@/lib/labels";
import { plusBonus, plusTiers, statAtLevel, type StatKind } from "@/lib/stats";
import { skillTextCht } from "@/lib/skills/chinese";
import { presentSkill } from "@/lib/skills/present";
import { getMonster, neighborMonsterIds, type MonsterBrief } from "@/lib/queries/monsters";

export default async function MonsterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    notFound();
  }
  const database = await getAppDatabase();
  const monsterId = Number(id);
  const [detail, neighbors] = await Promise.all([
    getMonster(database.db, monsterId),
    neighborMonsterIds(database.db, monsterId),
  ]);
  if (!detail) {
    notFound();
  }
  const { monster } = detail;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link className="text-sm text-muted" href="/">返回列表</Link>
        <div className="flex flex-wrap justify-end gap-2">
          <Link className="rounded border border-line bg-card px-3 py-1 text-sm" href={`/substitute?id=${monster.monsterId}`}>
            代用
          </Link>
          <MonsterStep href={neighbors.previous} label="上一隻" />
          <MonsterStep href={neighbors.next} label="下一隻" />
        </div>
      </div>
      <header className="flex flex-wrap items-start gap-4 rounded-lg border border-line bg-card p-4">
        <MonsterCardArt monsterId={monster.monsterId} name={monster.name} />
        <MonsterPortrait
          monsterId={monster.monsterId}
          size={100}
          attributes={[monster.attributePrimary, monster.attributeSecondary, monster.attributeTertiary]}
        />
        <div className="min-w-0">
        <p className="font-mono text-sm text-muted">#{monster.monsterId}</p>
        <h1 lang="ja" className="mt-1 break-words text-xl font-semibold sm:text-2xl">{monster.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {monster.nameCht && monster.nameCht !== monster.name ? monster.nameCht : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <AttributePips
            attributes={[
              monster.attributePrimary,
              monster.attributeSecondary,
              monster.attributeTertiary,
            ]}
          />
          <span>★{monster.rarity ?? "未知"}</span>
          <span>Cost {monster.cost ?? "未知"}</span>
          <span>Lv {monster.maxLevel ?? "未知"}</span>
          <span>{detail.types.map((type) => labelOrUnknown(typeLabels, type, "類型")).join(" / ")}</span>
        </div>
        </div>
      </header>
      <StatTable monster={monster} />
      <AwakeningPicker awakenings={detail.awakenings} superAwakenings={detail.superAwakenings} />
      <SkillBlock
        title="主動技能"
        skill={detail.activeSkill}
        emptyLabel={monster.activeSkillId ? "技能資料不在本次匯入中" : "無"}
      />
      <SkillBlock
        title="隊長技能"
        skill={detail.leaderSkill}
        emptyLabel={monster.leaderSkillId ? "技能資料不在本次匯入中" : "無"}
      />
      <section className="rounded-lg border border-line bg-card p-4">
        <h2 className="font-semibold">進化</h2>
        <p className="mt-1 text-sm text-muted">
          關係來自 evoBaseId，不是依名稱推測。類型：{detail.evolutionType ?? "未知"}
        </p>
        <Relation title="進化前" monsters={detail.previous ? [detail.previous] : []} />
        <Relation title="進化後" monsters={detail.next} />
        <Relation title="進化素材" monsters={detail.materials} />
        {detail.missingMaterialIds.length > 0 ? (
          <p className="mt-2 text-sm text-muted">
            缺少素材資料：{detail.missingMaterialIds.join(", ")}
          </p>
        ) : null}
        <Relation title="同進化根" monsters={detail.series} />
      </section>
      <p className="text-sm text-muted">來源 revision：{monster.sourceRevision ?? "未知"}</p>
      <SideArrow href={neighbors.previous} side="left" />
      <SideArrow href={neighbors.next} side="right" />
    </main>
  );
}

const statLevels = [1, 99, 110, 120];

function StatTable({
  monster,
}: {
  monster: {
    hpMin: number | null;
    hpMax: number | null;
    hpScale: number | null;
    atkMin: number | null;
    atkMax: number | null;
    atkScale: number | null;
    rcvMin: number | null;
    rcvMax: number | null;
    rcvScale: number | null;
    maxLevel: number | null;
    limitBreakIncr: number | null;
    is8Latent: boolean | null;
  };
}) {
  const canLimitBreak = (monster.limitBreakIncr ?? 0) > 0 || Boolean(monster.is8Latent);
  const plusLevel = canLimitBreak ? 120 : monster.maxLevel ?? 99;
  const rows: Array<{ label: string; kind: StatKind; min: number | null; max: number | null; scale: number | null }> = [
    { label: "HP", kind: "hp", min: monster.hpMin, max: monster.hpMax, scale: monster.hpScale },
    { label: "攻擊", kind: "atk", min: monster.atkMin, max: monster.atkMax, scale: monster.atkScale },
    { label: "回復", kind: "rcv", min: monster.rcvMin, max: monster.rcvMax, scale: monster.rcvScale },
  ];
  return (
    <section className="overflow-x-auto rounded-lg border border-line bg-card p-4">
      <table className="w-full min-w-[36rem] text-sm whitespace-nowrap">
        <thead>
          <tr className="text-muted">
            <th className="pb-2 text-left font-medium" />
            {statLevels.map((level) => (
              <th key={level} className="pb-2 text-right font-medium">Lv{level}</th>
            ))}
            {plusTiers.map((tier) => (
              <th key={tier.label} className="pb-2 text-right font-medium">{tier.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.kind}>
              <th className="py-1 text-left font-medium">{row.label}</th>
              {statLevels.map((level) => {
                const value = statAtLevel({
                  min: row.min,
                  max: row.max,
                  scale: row.scale,
                  maxLevel: monster.maxLevel,
                  limitBreakPercent: monster.limitBreakIncr,
                  canLimitBreak,
                  level,
                  kind: row.kind,
                });
                return (
                  <td key={level} className="py-1 text-right font-mono">
                    {value == null ? "—" : value.toLocaleString("zh-Hant")}
                  </td>
                );
              })}
              {plusTiers.map((tier) => {
                const base = statAtLevel({
                  min: row.min,
                  max: row.max,
                  scale: row.scale,
                  maxLevel: monster.maxLevel,
                  limitBreakPercent: monster.limitBreakIncr,
                  canLimitBreak,
                  level: plusLevel,
                  kind: row.kind,
                });
                const value = base == null ? null : base + plusBonus(row.kind, tier.points);
                return (
                  <td key={tier.label} className="py-1 text-right font-mono">
                    {value == null ? "—" : value.toLocaleString("zh-Hant")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">
        不含覺醒。+297、+300、+891 加在 Lv{plusLevel}。+297 是各 99，+300 是各 100，+891 是各 297。
      </p>
    </section>
  );
}

function SideArrow({ href, side }: { href: number | null; side: "left" | "right" }) {
  if (!href) {
    return null;
  }
  return (
    <Link
      aria-label={side === "left" ? "上一隻" : "下一隻"}
      className={`fixed top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-card text-3xl leading-none md:flex ${
        side === "left" ? "left-3" : "right-3"
      }`}
      href={`/monster/${href}`}
    >
      {side === "left" ? "‹" : "›"}
    </Link>
  );
}

function MonsterStep({ href, label }: { href: number | null; label: string }) {
  if (!href) {
    return (
      <span className="rounded border border-line px-3 py-1 text-sm text-muted opacity-40">{label}</span>
    );
  }
  return (
    <Link className="rounded border border-line bg-card px-3 py-1 text-sm" href={`/monster/${href}`}>
      {label === "上一隻" ? "← 上一隻" : "下一隻 →"}
    </Link>
  );
}

function SkillBlock({
  title,
  skill,
  emptyLabel,
}: {
  title: string;
  skill: {
    name: string;
    description: string;
    initialCooldown: number | null;
    maxLevel: number | null;
  } | null;
  emptyLabel: string;
}) {
  const presented = skill ? presentSkill(skill.description) : null;
  return (
    <section className="rounded-lg border border-line bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      {skill && presented ? (
        <>
          <p lang="ja" className="mt-2 font-medium">{skill.name || "未命名"}</p>
          {presented.note ? <SkillText text={presented.note} /> : null}
          {presented.assistVanishes ? <p className="text-sm">使用時，這隻輔助會消失。</p> : null}
          {presented.body ? <SkillText text={presented.body} /> : null}
          {presented.body ? (
            <p lang="zh-Hant" className="mt-1 whitespace-pre-wrap text-sm leading-7 text-muted">
              {skillTextCht(presented.body)}
            </p>
          ) : null}
          {presented.hasteTurns !== null ? (
            <p className="mt-2 text-sm">其他技能縮短 {presented.hasteTurns} 回合。</p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            初始冷卻 {skill.initialCooldown ?? "未知"}，最高 {skill.maxLevel ?? "未知"} 級
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">{emptyLabel}</p>
      )}
    </section>
  );
}

function Relation({
  title,
  monsters,
}: {
  title: string;
  monsters: MonsterBrief[];
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm text-muted">{title}</h3>
      {monsters.length === 0 ? (
        <p className="mt-1 text-sm">無</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-3">
          {monsters.map((monster, index) => (
            <li key={`${monster.monsterId}-${index}`}>
              <Link
                className="flex w-24 flex-col items-center gap-1 text-center"
                href={`/monster/${monster.monsterId}`}
                title={`#${monster.monsterId} ${displayMonsterName(monster)}`}
              >
                <MonsterPortrait
                  monsterId={monster.monsterId}
                  size={72}
                  attributes={[
                    monster.attributePrimary,
                    monster.attributeSecondary,
                    monster.attributeTertiary,
                  ]}
                />
                <span className="font-mono text-xs text-muted">#{monster.monsterId}</span>
                <span lang="ja" className="line-clamp-2 text-xs leading-4">{displayMonsterName(monster)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

