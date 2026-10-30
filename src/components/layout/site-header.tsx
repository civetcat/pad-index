import Link from "next/link";
import { LanguageSwitch } from "./language-switch";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex min-w-0 items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">PAD Index</span>
          <span className="truncate text-sm text-muted">非官方圖鑑</span>
        </Link>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 text-sm sm:mx-0 sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0">
          <Link className="shrink-0 rounded px-2 py-2" href="/">圖鑑</Link>
          <Link className="shrink-0 rounded px-2 py-2" href="/team">隊伍</Link>
          <Link className="shrink-0 rounded px-2 py-2" href="/compare">比較</Link>
          <Link className="shrink-0 rounded px-2 py-2" href="/calc">倍率</Link>
          <Link className="shrink-0 rounded px-2 py-2" href="/collection">收藏</Link>
          <Link className="shrink-0 rounded px-2 py-2" href="/account">帳號</Link>
          <Link className="shrink-0 rounded px-2 py-2" href="/admin">管理</Link>
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
}
