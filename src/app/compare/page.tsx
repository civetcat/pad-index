import Link from "next/link";
import { connection } from "next/server";
import { AttributePips } from "@/components/monster/attribute-pips";
import { MonsterPortrait } from "@/components/monster/monster-portrait";
import { getAppDatabase } from "@/lib/db/app-db";
import { labelOrUnknown, typeLabels } from "@/lib/labels";
import { getMonster } from "@/lib/queries/monsters";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const raw = Array.isArray(params.ids) ? params.ids[0] : params.ids;
  const ids = (raw ?? "")
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 3);
  const database = await getAppDatabase();
  const details = (
    await Promise.all(ids.map((id) => getMonster(database.db, id)))
  ).filter((detail) => detail !== null);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">怪物比較</h1>
      <form className="flex gap-2" method="get">
        <input
          className="flex-1 rounded border border-line bg-card px-3 py-2"
          name="ids"
          defaultValue={ids.join(",")}
          placeholder="例如 1,5,9"
        />
        <button className="shrink-0 rounded bg-accent px-3 py-2 text-sm text-white" type="submit">比較</button>
      </form>
      {details.length === 0 ? (
        <p className="text-muted">輸入最多 3 個怪物 ID。</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {details.map((detail) => (
            <article key={detail.monster.monsterId} className="rounded-lg border border-line bg-card p-4">
              <MonsterPortrait
                monsterId={detail.monster.monsterId}
                size={72}
                attributes={[
                  detail.monster.attributePrimary,
                  detail.monster.attributeSecondary,
                  detail.monster.attributeTertiary,
                ]}
              />
              <Link className="mt-2 block font-semibold underline" href={`/monster/${detail.monster.monsterId}`}>
                #{detail.monster.monsterId} <span lang="ja">{detail.monster.name}</span>
              </Link>
              {detail.monster.nameCht && detail.monster.nameCht !== detail.monster.name ? (
                <p className="text-sm text-muted">{detail.monster.nameCht}</p>
              ) : null}
              <div className="mt-2">
                <AttributePips
                  attributes={[
                    detail.monster.attributePrimary,
                    detail.monster.attributeSecondary,
                    detail.monster.attributeTertiary,
                  ]}
                />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div>★{detail.monster.rarity ?? "未知"} / Cost {detail.monster.cost ?? "未知"}</div>
                <div>HP {detail.monster.hpMax ?? "未知"}</div>
                <div>攻擊 {detail.monster.atkMax ?? "未知"}</div>
                <div>回復 {detail.monster.rcvMax ?? "未知"}</div>
                <div>{detail.types.map((type) => labelOrUnknown(typeLabels, type, "類型")).join(" / ")}</div>
                <div>主動冷卻 {detail.activeSkill?.initialCooldown ?? "無"}</div>
                <div>隊長技 {detail.leaderSkill?.name ?? "無"}</div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
