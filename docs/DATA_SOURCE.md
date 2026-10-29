# 資料來源

調查日期：2026-10-29。以下只記錄已確認的事實。

## 採用來源

[Mapaler/PADDashFormation](https://github.com/Mapaler/PADDashFormation)

- 預設 branch：`master`
- 資料路徑：`monsters-info/`
- 調查當下，`monsters-info` 最新 commit：`b6c56dc1a67c3d72767e3d6a1ba3ffa373d2895f`（2026-10-26，訊息「2026年10月26日」）
- 軟體授權：GPL-3.0
- 本專案只讀公開 JSON，不複製 `script-skill-parser.js` 或 `parseCard.js`

使用的檔案：

| 檔案 | 用途 |
| --- | --- |
| `monsters-info/mon_ja.json` | 日文怪物主資料，約 16 MB |
| `monsters-info/mon_en.json` | 英文名稱與說明 |
| `monsters-info/mon_ko.json` | 韓文名稱與說明 |
| `monsters-info/skill_ja.json` | 日文技能主資料 |
| `monsters-info/skill_en.json` | 英文技能 |
| `monsters-info/skill_ko.json` | 韓文技能 |
| `monsters-info/ckey.json` | 各語言 card/skill hash 與 `updateTime` |
| `monsters-info/official-API/*.json` | 抓包後的原始陣列，匯入時保留，不當作顯示來源 |

`ckey.json` 在調查當下的 `updateTime` 為 `1792991795702`。

## 已確認的欄位

怪物物件包含：`id`、`name`、`attrs`、`types`、`isUltEvo`、`rarity`、`cost`、`maxLevel`、`hp`/`atk`/`rcv`/`exp`、`activeSkillId`、`leaderSkillId`、`evoBaseId`、`evoMaterials`、`unevoMaterials`、`awakenings`、`superAwakenings`、`evoRootId`、`otLangName`。

`evoMaterials` 裡的 `0` 是空素材格，不是怪物 ID。

技能物件包含：`id`、`name`、`description`、`type`、`maxLevel`、`initialCooldown`、`unk`、`params`。

`type` 是遊戲的技能代碼，`params` 是對應數值。效果分類留到後續階段，未知代碼不可丟棄。

已核對的技能樣本是 `skill_ja.json` 的 id 1：`ヒートブレス`，`type` 0，`params` `[0, 1000]`。

## 不採用的來源

`Mapaler/Puzzle-and-Dragons-Data-Files` 的 `mon2/` 已確認存在：

- repository：https://github.com/Mapaler/Puzzle-and-Dragons-Data-Files
- branch：`master`
- 路徑：`mon2/`
- 調查當下 commit：`86c607578c06a323c9d56266ce5c8388c32d3b09`（2026-10-26）
- 約 29,971 個檔，主要是 `.bc`、`.wav`、`.bin`、`.btex`
- 沒有 LICENSE
- 內容是遊戲資產，不是可匯入的怪物資料庫

依確認結果，更新檢查盯的是 PADDashFormation 的 `monsters-info`，不解析 `mon2`。

`kiootic/pad-rikuu` 在 2018 封存。`TsubakiBotPad/pad-cogs` 與 `pad-data-pipeline` 在 2023 停更。

## 授權限制

PADDashFormation README 寫明卡片圖片與怪物資訊的權利屬於 GungHo Online Entertainment, Inc. 中文名稱來自已關閉的戰友網與後續人工補充，不完整。

官方 `download_card_data` API 需要加密參數。Mapaler 是從遊戲下載過程抓包，本專案不重做這一步。

公開展示遊戲資料是社群常見做法，但沒有 GungHo 的再散布授權。網站必須標明非官方。
