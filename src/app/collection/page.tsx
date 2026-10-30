"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const storageKey = "pad-index-favorites";
const listeners = new Set<() => void>();

function readLocalIds() {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as number[];
  } catch {
    return [];
  }
}

function writeLocalIds(ids: number[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(ids));
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export default function CollectionPage() {
  const localIds = useSyncExternalStore(subscribe, readLocalIds, () => []);
  const [accountIds, setAccountIds] = useState<number[] | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/api/account/favorites")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body: { monsterIds?: number[] } | null) => {
        setAccountIds(body?.monsterIds ?? null);
      })
      .catch(() => setAccountIds(null));
  }, []);

  function saveLocal(ids: number[]) {
    writeLocalIds(ids);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">收藏</h1>
      <p className="text-sm text-muted">未登入時存在這台瀏覽器。登入後可另外存到帳號。</p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const id = Number(draft);
          if (Number.isInteger(id) && id > 0 && !localIds.includes(id)) {
            saveLocal([...localIds, id]);
          }
          setDraft("");
        }}
      >
        <input className="flex-1 rounded border border-line bg-card px-3 py-2" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="怪物 ID" />
        <button className="rounded bg-accent px-3 py-2 text-sm text-white" type="submit">加入本機</button>
      </form>
      <IdList title="本機收藏" ids={localIds} />
      <IdList title="帳號收藏" ids={accountIds ?? []} empty={accountIds === null ? "未登入" : "沒有收藏"} />
    </main>
  );
}

function IdList({ title, ids, empty = "沒有收藏" }: { title: string; ids: number[]; empty?: string }) {
  return (
    <section className="rounded-lg border border-line bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      {ids.length === 0 ? <p className="mt-2 text-sm text-muted">{empty}</p> : (
        <ul className="mt-2 space-y-1 text-sm">
          {ids.map((id) => (
            <li key={id}><Link className="underline" href={`/monster/${id}`}>#{id}</Link></li>
          ))}
        </ul>
      )}
    </section>
  );
}
