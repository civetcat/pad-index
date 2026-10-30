"use client";

import Link from "next/link";
import { useState } from "react";
import { skillLevelOneCooldown } from "@/lib/calc";

type Hit = { monsterId: number; name: string; nameEn: string | null; nameCht: string | null };

export default function TeamPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [slots, setSlots] = useState<Array<Hit & { cooldown: number | null }>>([]);
  const [turns, setTurns] = useState(0);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const body = (await response.json()) as { items: Hit[] };
    setHits(body.items ?? []);
  }

  async function add(hit: Hit) {
    if (slots.length >= 6 || slots.some((slot) => slot.monsterId === hit.monsterId)) {
      return;
    }
    const response = await fetch(`/api/monsters/${hit.monsterId}`);
    const body = (await response.json()) as { activeCooldown?: number | null };
    setSlots([...slots, { ...hit, cooldown: body.activeCooldown ?? null }]);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">隊伍與冷卻</h1>
      <p className="text-sm text-muted">
        最多 6 隻。冷卻只顯示技能等級 1 的初始冷卻，來源沒有每級縮短曲線，所以不推算高等級冷卻。
      </p>
      <form className="flex gap-2" onSubmit={search}>
        <input className="flex-1 rounded border border-line bg-card px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名稱或 ID" />
        <button className="rounded bg-accent px-3 py-2 text-sm text-white" type="submit">搜尋</button>
      </form>
      <ul className="grid gap-2 sm:grid-cols-2">
        {hits.map((hit) => (
          <li key={hit.monsterId}>
            <button className="w-full rounded border border-line bg-card px-3 py-2 text-left text-sm" onClick={() => add(hit)} type="button">
              #{hit.monsterId} {hit.name}
            </button>
          </li>
        ))}
      </ul>
      <section className="rounded-lg border border-line bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">目前隊伍</h2>
          <label className="text-sm text-muted">
            經過回合
            <input className="ml-2 w-16 rounded border border-line bg-background px-2 py-1" type="number" min={0} value={turns} onChange={(event) => setTurns(Number(event.target.value))} />
          </label>
        </div>
        {slots.length === 0 ? <p className="mt-3 text-sm text-muted">還沒選怪物。</p> : null}
        <ul className="mt-3 space-y-2 text-sm">
          {slots.map((slot) => {
            const cooldown = skillLevelOneCooldown(slot.cooldown);
            const ready = cooldown === null ? "冷卻未知" : Math.max(0, cooldown - turns) === 0 ? "可再使用" : `還需 ${cooldown - turns} 回合`;
            return (
              <li key={slot.monsterId} className="flex items-center justify-between gap-3">
                <Link className="underline" href={`/monster/${slot.monsterId}`}>#{slot.monsterId} {slot.name}</Link>
                <span>{cooldown ?? "未知"} → {ready}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
