import { dataSource } from "@/lib/source";

const sourceRows = [
  ["Repository", dataSource.repositoryUrl],
  ["Branch", dataSource.branch],
  ["資料路徑", dataSource.dataPath],
  ["怪物", dataSource.files.monstersJa],
  ["技能", dataSource.files.skillsJa],
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <section className="rounded-lg border border-line bg-card p-5">
        <p className="text-sm font-medium text-accent">Phase 1</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          龍族拼圖圖鑑
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          這個網站會用來查詢怪物、技能與進化路線。目前只有專案骨架與資料庫
          schema，沒有匯入任何怪物。
        </p>
      </section>

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">資料來源</h2>
        <dl className="mt-4 divide-y divide-line">
          {sourceRows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4"
            >
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-mono text-sm break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
