"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 py-10">
      <h1 className="text-2xl font-semibold">載入失敗</h1>
      <p className="text-muted">請再試一次。如果資料庫還沒建立，先執行匯入。</p>
      <button className="w-fit rounded border border-line px-3 py-2 text-sm" onClick={reset} type="button">
        重試
      </button>
    </main>
  );
}
