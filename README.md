# PAD Index

非官方《龍族拼圖》（Puzzle & Dragons）圖鑑。目前是 Phase 1：專案骨架與本機資料庫 schema。尚未匯入怪物，也尚未部署。

## 技術架構

- Next.js 16 App Router、TypeScript、Tailwind CSS
- pnpm（透過 Node 的 corepack）
- Zod 驗證公開 JSON 形狀
- Drizzle ORM、本機 SQLite（libSQL）
- Vitest、ESLint

正式環境預計使用 Cloudflare D1。Workers 不能把本機 SQLite 檔案當永久資料庫，所以匯入腳本留在本機。部署方式留到 Phase 6 再決定，Cloudflare 目前建議 vinext，它仍是 beta。

## 開發環境

- Node.js 24
- corepack 可用的 pnpm 10

這台環境沒有全域 `pnpm`。請用 `corepack pnpm`。

## 安裝

```bash
corepack pnpm install
```

## 本機啟動

```bash
corepack pnpm dev
```

開發伺服器位址以終端機輸出為準，通常是 http://localhost:3000。

## 資料庫初始化

```bash
corepack pnpm db:migrate
```

預設寫入 `data/pad.sqlite`。可用 `DATABASE_URL` 覆蓋，範例見 `.env.example`。

修改 `src/lib/db/schema.ts` 之後：

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
```

## 資料來源

設定在 `src/lib/source.ts`。

- Repository：https://github.com/Mapaler/PADDashFormation
- Branch：`master`
- 路徑：`monsters-info/`

細節與不採用 `mon2` 的原因見 [docs/DATA_SOURCE.md](docs/DATA_SOURCE.md)。

## 尚未實作

以下指令不存在，請不要假設已經可以執行：

- 資料匯入
- GitHub 更新檢查
- 更新差異
- 套用新資料
- Cloudflare 部署
- secrets 設定

`GITHUB_TOKEN` 目前不需要。之後若 GitHub API rate limit 擋住檢查，再放到環境變數或平台 secrets，不可寫進前端或 `NEXT_PUBLIC_*`。

## 測試與檢查

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
```

## 常見問題

`pnpm` 不是可執行命令：改用 `corepack pnpm`。`corepack enable` 若因權限失敗，不影響 `corepack pnpm`。
