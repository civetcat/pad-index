import { connection } from "next/server";
import { MonsterCard } from "@/components/monster/monster-card";
import { Pagination } from "@/components/monster/pagination";
import { SearchForm } from "@/components/monster/search-form";
import { catalogStatus, getAppDatabase } from "@/lib/db/app-db";
import { parseMonsterFilters } from "@/lib/queries/filters";
import { listMonsters } from "@/lib/queries/monsters";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const filters = parseMonsterFilters(await searchParams);
  const status = await catalogStatus();
  if (!status.ready || status.count === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-8">
        <h1 className="text-3xl font-semibold">龍族拼圖圖鑑</h1>
        <p className="text-muted">資料庫還沒有可顯示的怪物。請在專案目錄執行：</p>
        <pre className="overflow-x-auto rounded border border-line bg-card p-4 text-sm">corepack pnpm db:import</pre>
      </main>
    );
  }
  const database = await getAppDatabase();
  const result = await listMonsters(database.db, filters);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold">怪物圖鑑</h1>
        <p className="text-sm text-muted">{result.total} 筆符合，資料庫 {status.count} 筆</p>
      </div>
      <SearchForm filters={filters} />
      {result.items.length === 0 ? (
        <p className="rounded border border-line bg-card p-6 text-muted">沒有符合的怪物。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.items.map((monster) => (
            <MonsterCard key={monster.monsterId} monster={monster} />
          ))}
        </div>
      )}
      <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
    </main>
  );
}
