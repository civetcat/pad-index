# Cloudflare 部署

公開網址：https://pad-index.darkangel20305123.workers.dev

自訂網域還沒設定。要綁自己的網域，需在 Cloudflare 加入該網域後再加 Worker route。

本機使用 SQLite 檔案。Workers 不能把這個檔案當永久資料庫，正式環境要用 Cloudflare D1。

建議路徑是 Cloudflare 目前文件中的 vinext。它仍是 beta。本專案已加入 `vite.config.ts`、`cloudflare.config.ts` 與 `pnpm deploy:vinext`。vinext 相容性檢查為 96%，`cacheComponents` 已關閉。自訂網域要等 Cloudflare 帳號與你自己的網域，目前沒有設定。

部署前需要你登入 Cloudflare。OpenCode 不能代登。

1. 安裝並登入 Wrangler：`corepack pnpm dlx wrangler login`
2. 建立 D1：`corepack pnpm dlx wrangler d1 create pad-index`
3. 把回傳的 `database_id` 寫進 wrangler 設定，不要提交假 ID。
4. 套用 migration：`corepack pnpm dlx wrangler d1 execute pad-index --remote --file=drizzle/0000_init.sql`
5. 之後的 SQL 檔依序套用。
6. 用本機匯入腳本產生資料後，再決定如何灌進 D1。不要在未驗證時由排程覆蓋。
7. 設定 secret：`wrangler secret put ADMIN_SECRET`
8. 確認相容後部署。成功前不要把任何 workers.dev 網址寫成已上線。

排程檢查在 `.github/workflows/check-upstream.yml`。它只檢查，不套用。若之後有公開網址，可在 GitHub secrets 設定 `SITE_URL` 與 `ADMIN_SECRET`，Action 才會呼叫管理檢查 API。
