# examples/ — 內容 JSON 範本

以 `Sample/2026釜山行🇰🇷.pdf` 為來源,產出的一組**內容資料範本**。
用途:對應 `doc/Issue.md` 項次 003「開發順序」第 1 步 —— 在還沒接 Notion 前,先用手寫 JSON 讓 React + PWA 跑起來。

正式化後,這些檔會改由 GitHub Actions 從 Notion 產生到 `public/data/<slug>/`(該路徑已在 `.gitignore` 排除)。

## 檔案結構

```
examples/
├─ trips.json                    # 第一頁的專案選單(含 lang)
├─ busan-2026/
│  ├─ itinerary.json             # 每日行程(days[].items[])
│  ├─ flights.json               # 去回程航班
│  ├─ hotels.json                # 住宿
│  ├─ transport.json             # 交通票券、乘車、連結
│  └─ guide.json                 # 旅遊攻略(簽證 / 入境 / 電壓 / 退稅 / 緊急 / 禁忌)
└─ phrases/
   └─ ko.json                    # 語言小卡句庫(依語言共用,不綁行程)
```

前端讀取路徑:內容 `/data/<slug>/itinerary.json` 等;句庫 `/data/phrases/<lang>.json`。
`lang` 由 `trips.json` 該行程的欄位決定(`ko` / `ja` / `th` / `en`)。

## Schema 摘要

### trips.json — `Trip[]`
| 欄位 | 型別 | 說明 |
|---|---|---|
| slug | string | 專案代號,對應 `data/<slug>/` 與 Supabase 的 `trip_slug` |
| name | string | 顯示名稱 |
| emoji | string | 選單卡片小圖示 |
| lang | `ko` \| `ja` \| `th` \| `en` | 決定語言小卡讀哪份句庫 |
| startDate / endDate | `YYYY-MM-DD` | 期間 |
| cities | string[] | 城市 |
| timezones | `{label,tz}[]` | 首頁多時鐘(如釜山 + 台北) |
| cover | string | 封面圖路徑 |
| status | `upcoming` \| `ongoing` \| `ended` | 狀態 |

### itinerary.json
- `days[]`:`{ day, date, weekday, title, items[], images? }`（`title` = 當日主題,如「海雲台」）
- `items[]`:`{ time, type, title, note?, pass?, mapUrl? }`(`mapUrl` = Google 地圖連結)
- `type`:`transport` / `food` / `sightseeing` / `activity` / `shopping` / `hotel` / `note`
- `pass`:使用的票券名稱(可選),前端可標記徽章
- `images[]`:`{ src, caption?, link? }`(該日插圖,可多張;來源:Notion「每日圖片」資料庫,見 `doc/Notion.md`)
  - `src`:`images/<slug>/<檔名>` 或外部 URL
  - `caption`:圖片說明,無則不顯示
  - `link`:點圖開啟的連結,無則圖片不可點擊

### flights.json
- `segments[]`:`{ kind: outbound|return, flightNo, airline, from{code,name}, to{code,name}, departLocal, arriveLocal }`
- 時間用「當地時間」字串,顯示時再依 `trips.json` 的時區換算
- **格式慣例**(2026-09-05 統一,見 `doc/Issue.md`):
  - `from.name` / `to.name` 一律填**機場全名 + 航廈**,例:`桃園國際機場 T1`、`東京成田國際機場 T1`,不要只填縮寫地名(如 `桃園 T1`)。
  - `departLocal` / `arriveLocal` 一律含**完整日期**,格式 `YYYY-MM-DD HH:mm`,不要只填 `HH:mm`;日期需與該行程 `trips.json` 的 `startDate`/`endDate` 對齊。

### hotels.json
- `stays[]`:`{ name, area, checkIn, checkOut, nights, address, mapUrl, note }`

### transport.json
- `passes[]`:`{ name, note, usedFor[] }`
- `rides[]`:`{ date, mode, from, to, fare, note }`
- `links[]`:`{ label, url }`

### guide.json
- `sections[]`:`{ key, label, items[] }`
- `reminder`:string

### phrases/&lt;lang&gt;.json（依語言共用）
- `lang`:`ko` / `ja` / `th` / `en`
- `categories[]`:`{ key, label, phrases[] }`
- `key`:`basic` / `transport` / `place` / `sightseeing` / `facility` / `food` / `shopping` / `lodging` / `emergency`
- `phrases[]`:`{ zh, target, roman }`(`roman` = 拼音 / 念法）
- 所有同語言的行程共用同一份;在 Notion「語言句庫」表以「語言 + 分類」維護
