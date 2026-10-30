# 資料匯入

匯入來源是 `Mapaler/PADDashFormation` 的 `monsters-info`。指令：

```bash
corepack pnpm db:migrate
corepack pnpm db:import
```

`db:import` 會：

1. 讀取 `monsters-info` 最新 commit。讀不到時不編造 SHA，revision 留空。
2. 下載 `mon_ja.json`、`skill_ja.json`、`skill_en.json`。
3. 用 Zod 逐筆驗證。錯誤列不寫入，原始技能文字仍保留。
4. 驗證失敗比例過高時中止，不改正式怪物資料。
5. 在交易內新增或更新。同一 revision 再匯入不會產生重複列。
6. 來源缺檔不會把缺的怪物當成刪除。
7. 套用前若本機 SQLite 已存在，會複製一份 `data/pad.sqlite.bak-<time>`。

管理 API 需要 `ADMIN_SECRET`，而且只在伺服器端比對。不要用 `NEXT_PUBLIC_`。

- `POST /api/admin/check`：只檢查 commit，不套用。
- `POST /api/admin/dry-run`：下載並驗證，不寫怪物表。
- `POST /api/admin/apply`：備份後套用。

Header：`Authorization: Bearer <ADMIN_SECRET>`。
