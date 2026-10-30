import Link from "next/link";

export default function MonsterNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 py-10">
      <h1 className="text-2xl font-semibold">找不到這隻怪物</h1>
      <p className="text-muted">這個 ID 不在目前資料庫。</p>
      <Link className="text-sm underline" href="/">返回列表</Link>
    </main>
  );
}
