# 關卡目錄：Mac + iPhone 接手

本機 Windows 已經把 `mon2` 裡能解的關卡腳本解開。名稱、體力和完整樓層表不在 `mon2`，要從你自己的日服客戶端抓 `download_dungeon_data` 回應。

## 已經完成

- 站點：https://padsearcher.darkangel20305123.workers.dev
- `mon2/st_*.txt`：783 個戰鬥腳本，解密 0 失敗，涵蓋 99 個地下城編號
- `mon2/dung*.info`：175 個背景波次檔
- 本機結果（不進 git）：
  - `data/dungeons/stages.json`
  - `data/dungeons/index.json`
  - `data/dungeons/backgrounds.json`
  - `data/dungeons/catalog.json`
- 接表程式已在 `main`：`scripts/join-dungeon-catalog.ts`

`mon2` 是手機裡 `/data/data/jp.gungho.pad/files/mon2` 的素材，只有圖片、音效和戰鬥腳本。官方目錄在登入後另外下載。

## 你要抓的檔

遊戲打到這些網址之一：

- `api-adr.padsv.gungho.jp`
- `api-ht-adr.padsv.gungho.jp`

參數含 `action=download_dungeon_data`。把那個 JSON 回應存成：

`pad-index/data/upstream-src/download_dungeon_data.json`

JSON 裡要有 `dungeons` 欄位。`d;` 開頭是地下城名稱，`f;` 開頭是樓層、體力和限制。沒有登入簽章時，這個位址只回 `{"res":1}`，不要把那個空回應存下來。

## Mac 上的步驟

1. 進入專案後拉最新程式：

```bash
git pull
```

2. 用 Proxyman 或 Charles。iPhone 和 Mac 連同一個 Wi-Fi。
3. iPhone 的 Wi-Fi 代理指到 Mac，安裝並信任描述檔。
4. 打開日服，讓它下載資料。
5. 在代理裡找到網址含 `download_dungeon_data` 的回應，存到上面的路徑。
6. 在 `pad-index` 目錄執行：

```bash
corepack pnpm exec tsx scripts/join-dungeon-catalog.ts
```

成功的話會寫出 `data/dungeons/official-catalog.json`，並印出對上的地下城數量。對上之後把終端輸出留著，回到這台對話即可。

## 如果遊戲連不上

App 不信任使用者憑證時，代理會讓遊戲一直無法連線。不要為了這個去越獄或拆憑證檢查。

那種情況改用模擬器登入你自己的日服帳號，讓它下載資料後再抓同一種回應。資料來源仍是你的客戶端。

## 不要做的事

- 不要把 `data/` 提交上去。這個目錄已在 `.gitignore`。
- 不要偽造官方簽章，也不要用別人的帳號。
- 不要把 2023 年的英文 `dungeons.txt` 當成現在的資料。裡面的地下城 500 叫 Radiant Queen，但現在的 `st_500206` 開頭是「パズドラ物語」，編號已經對不上。
