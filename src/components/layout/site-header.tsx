import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">PAD Index</span>
          <span className="text-sm text-muted">非官方圖鑑</span>
        </Link>
        <p className="text-sm text-muted">資料尚未匯入</p>
      </div>
    </header>
  );
}
