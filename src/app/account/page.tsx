"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [current, setCurrent] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/account/me")
      .then((response) => response.json())
      .then((body: { user: { username: string } | null }) => setCurrent(body.user?.username ?? null))
      .catch(() => setCurrent(null));
  }, []);

  async function submit(path: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = (await response.json()) as { username?: string; error?: string };
    setMessage(body.error ?? `已登入 ${body.username ?? ""}`);
    if (response.ok) {
      setCurrent(body.username ?? current);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">帳號</h1>
      <p className="text-sm text-muted">密碼以 PBKDF2 儲存，不會保存明文。這是本站帳號，不是官方 PAD 帳號。</p>
      <p className="text-sm">{current ? `目前：${current}` : "尚未登入"}</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">帳號</span>
        <input className="rounded border border-line bg-card px-3 py-2" value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">密碼</span>
        <input className="rounded border border-line bg-card px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="rounded bg-accent px-3 py-2 text-sm text-white" onClick={() => submit("/api/account/login")} type="button">登入</button>
        <button className="rounded border border-line px-3 py-2 text-sm" onClick={() => submit("/api/account/register")} type="button">註冊</button>
        <button
          className="rounded border border-line px-3 py-2 text-sm"
          onClick={async () => {
            await fetch("/api/account/logout", { method: "POST" });
            setCurrent(null);
            setMessage("已登出");
          }}
          type="button"
        >
          登出
        </button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </main>
  );
}
