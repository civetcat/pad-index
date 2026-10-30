import Link from "next/link";
import { connection } from "next/server";
import { MonsterPortrait } from "@/components/monster/monster-portrait";
import { getAppDatabase } from "@/lib/db/app-db";
import { displayMonsterName } from "@/lib/labels";
import { findSubstitutes, type SubstituteGroup } from "@/lib/queries/substitutes";

export default async function SubstitutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const monsterId = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  const database = monsterId ? await getAppDatabase() : null;
  const groups = database && monsterId ? await findSubstitutes(database.db, monsterId) : null;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">代用</h1>
      <p className="text-sm text-muted">
        列出技能編號相同，或技能效果相近的怪物。數字可以不同，例如 13 回合和 10 回合的屬性吸收。不是攻略站的推薦。
      </p>
      <form className="flex gap-2" method="get">
        <input
          className="min-w-0 flex-1 rounded border border-line bg-card px-3 py-2"
          name="id"
          inputMode="numeric"
          defaultValue={monsterId ?? ""}
          placeholder="怪物 ID"
        />
        <button className="shrink-0 rounded bg-accent px-3 py-2 text-sm text-white" type="submit">
          查代用
        </button>
      </form>
      {monsterId && groups === null ? <p className="text-muted">找不到這隻怪物。</p> : null}
      {groups?.length === 0 ? <p className="text-muted">沒有技能效果相近的代用。</p> : null}
      {groups?.map((group) => (
        <Group key={group.title} group={group} />
      ))}
    </main>
  );
}

function Group({ group }: { group: SubstituteGroup }) {
  return (
    <section className="rounded-lg border border-line bg-card p-4">
      <h2 className="font-semibold">{group.title}</h2>
      <p className="mt-1 text-sm text-muted">
        {group.note}
        {group.total > group.monsters.length ? ` 顯示 ${group.monsters.length} / ${group.total}。` : ""}
      </p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {group.monsters.map((monster) => (
          <li key={monster.monsterId}>
            <Link
              className="flex w-24 flex-col items-center gap-1 text-center"
              href={`/monster/${monster.monsterId}`}
              title={`#${monster.monsterId} ${displayMonsterName(monster)}`}
            >
              <MonsterPortrait
                monsterId={monster.monsterId}
                size={72}
                attributes={[monster.attributePrimary, monster.attributeSecondary, monster.attributeTertiary]}
              />
              <span className="font-mono text-xs text-muted">#{monster.monsterId}</span>
              <span lang="ja" className="line-clamp-2 text-xs leading-4">{monster.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
