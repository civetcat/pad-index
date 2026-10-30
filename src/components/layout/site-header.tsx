import Link from "next/link";
import { LanguageSwitch } from "./language-switch";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">PAD Index</span>
          <span className="text-sm text-muted">非官方圖鑑</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <Link href="/">圖鑑</Link>
          <Link href="/team">隊伍</Link>
          <Link href="/compare">比較</Link>
          <Link href="/calc">倍率</Link>
          <Link href="/collection">收藏</Link>
          <Link href="/account">帳號</Link>
          <Link href="/admin">管理</Link>
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
}
