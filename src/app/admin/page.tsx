"use client";

import { useState } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [output, setOutput] = useState("尚未執行。套用前請先檢查與 dry-run。");
  const [pending, setPending] = useState(false);

  async function run(path: string) {
    setPending(true);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      setOutput(await response.text());
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "請求失敗");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">資料管理</h1>
      <p className="text-sm text-muted">
        管理密鑰只在這次請求送出，不會寫進前端環境變數。未設定 ADMIN_SECRET 時，所有操作都會拒絕。
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">管理密鑰</span>
        <input
          className="rounded border border-line bg-card px-3 py-2"
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="rounded border border-line px-3 py-2 text-sm" disabled={pending} onClick={() => run("/api/admin/check")} type="button">
          檢查更新
        </button>
        <button className="rounded border border-line px-3 py-2 text-sm" disabled={pending} onClick={() => run("/api/admin/dry-run")} type="button">
          Dry-run
        </button>
        <button className="rounded bg-accent px-3 py-2 text-sm text-white" disabled={pending} onClick={() => run("/api/admin/apply")} type="button">
          套用已驗證資料
        </button>
      </div>
      <pre className="overflow-x-auto rounded border border-line bg-card p-4 text-sm whitespace-pre-wrap">{output}</pre>
    </main>
  );
}
