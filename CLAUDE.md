# CLAUDE.MD - Travel APP 專案說明文件

## 專案概述

**Travel APP** 是一個旅遊行程 Web / PWA 應用程式，給旅客（跟團或自由行）在行程中隨時查看當日安排、地圖、票券、攻略，並在國外也能離線使用。

主要功能：
- **多專案切換**：第一頁選行程（沖繩 / 泰國 / 釜山…），進入後看該行程內容
- **每日行程**：逐時段安排，分類標記（交通 / 飲食 / 景點 / 遊玩 / 購物 / 住宿 / 備註），可帶 Google 地圖連結與票券徽章
- **機票 / 住宿 / 交通**：航班、飯店、票券（如釜山 PASS）、乘車紀錄
- **旅遊攻略 / 語言小卡**：簽證、入境、電壓、退稅、緊急聯絡；常用短句句庫
- **使用者功能（規劃中）**：登入、記帳、分帳、平安回報、相簿上傳（Supabase）
- **離線可用**：PWA + Service Worker 快取，可「加入主畫面」
- **內容由 Notion 控制**：以 Notion 為後台，GitHub Actions 同步成靜態 JSON

---

## 技術棧和框架

| 類別 | 技術 |
|------|------|
| 建置工具 | Vite 5 |
| 前端框架 | React 18 + TypeScript |
| 路由 | React Router 6（`HashRouter`，配合 GitHub Pages 靜態部署） |
| 資料抓取 / 快取 | TanStack Query 5 |
| PWA | vite-plugin-pwa 0.20（`generateSW`、NetworkFirst 內容快取） |
| 使用者資料後端 | Supabase（PostgreSQL 17 + Auth + Storage，region `ap-northeast-2`） |
| 內容後台 | Notion（`@notionhq/client`，僅用於同步腳本） |
| 同步腳本執行 | tsx（`node --env-file=.env --import tsx`） |
| 部署 | GitHub Pages（`.github/workflows/deploy.yml`） |
| 內容同步 | GitHub Actions（`.github/workflows/sync-notion.yml`，每小時 + 手動） |
| Node 版本 | 20+（開發機實測 v24） |

---

## 系統架構

內容與使用者資料分開處理：

```
┌─ 內容（唯讀，你自己編輯）────────────────────────────┐
│  Notion「Travel APP 內容」                              │
│    行程專案 / 每日行程 / 航班 / 住宿 / 交通票券 /       │
│    旅遊攻略（依 slug）  ＋  語言句庫（依 lang）          │
│        │  scripts/sync-notion.ts（GitHub Actions 每小時）│
│        ▼                                                │
│  public/data/trips.json                                 │
│  public/data/<slug>/{itinerary,flights,hotels,          │
│                      transport,guide}.json              │
│  public/data/phrases/<lang>.json                        │
└────────────────────────────────────────────────────────┘
                     │  瀏覽器 fetch（同網域靜態檔）
                     ▼
┌─ 前端 React（GitHub Pages 靜態站）──────────────────────┐
│  /            選行程                                     │
│  /t/:slug/*   首頁 / 行程 / 機票 / 住宿 / 交通 / 攻略 / 語言 │
└────────────────────────────────────────────────────────┘
                     │  @supabase/supabase-js（瀏覽器直連，RLS 保護）
                     ▼
┌─ 使用者資料（App 內寫入）──────────────────────────────┐
│  Supabase：profiles / trip_members / expenses /         │
│  expense_splits / safety_reports / sos_events /         │
│  photos / packing_checks / message_receipts             │
│  全表 RLS：僅能存取自己的資料（trip_slug 隔開不同行程） │
└────────────────────────────────────────────────────────┘
```

前端**不直接呼叫 Notion API**（CORS + token 機密），一律經 JSON。詳見 `doc/Issue.md` 項次 001。

---

## 重要目錄結構

```
Travel APP/
├── index.html                        # Vite 進入 HTML
├── vite.config.ts                    # base、PWA、runtimeCaching 設定
├── tsconfig.json
├── package.json                      # scripts: dev / build / preview / sync:notion
├── .env.example                      # 環境變數範本（.env 不進版控）
├── .claude/launch.json               # 本機預覽 dev server 設定
│
├── src/
│   ├── main.tsx                      # createHashRouter + QueryClientProvider
│   ├── index.css                     # 全域樣式（暖色系 tokens）
│   ├── types.ts                      # Trip / Itinerary / Flights / … 型別
│   ├── vite-env.d.ts                 # import.meta.env 型別
│   ├── lib/
│   │   ├── content.ts                # fetch public/data/*.json
│   │   ├── supabase.ts               # createClient（無金鑰時優雅停用）
│   │   └── trip.ts                   # localStorage 記住選過的行程
│   └── pages/
│       ├── TripPicker.tsx            # 第一頁：選行程
│       ├── TripLayout.tsx            # 底部分頁殼 + 切換行程
│       ├── Home.tsx                  # 雙時鐘、今日行程、工具卡
│       ├── Itinerary.tsx             # 每日行程（類型圖示、地圖、票券）
│       ├── Flights.tsx / Hotels.tsx / Transport.tsx
│       └── Guide.tsx / Phrases.tsx
│
├── public/
│   ├── favicon.svg
│   └── data/                         # 內容 JSON（手寫階段；接 Notion 後由 Actions 產生）
│       ├── trips.json
│       └── busan-2026/*.json
│
├── scripts/
│   └── sync-notion.ts                # Notion → public/data 同步
│
├── examples/                         # 內容 JSON 範本 + schema 說明（README.md）
│
├── .github/workflows/
│   ├── deploy.yml                    # build + 部署 GitHub Pages
│   └── sync-notion.yml              # 每小時從 Notion 同步、commit
│
└── doc/                              # 專案內部文件（不進版控）
    ├── Issue.md                      # 問題與決策紀錄（append-only 項次制）
    ├── Database.md                   # Supabase 表結構
    ├── Notion.md                     # Notion 內容後台結構
    └── secrets.local.md             # 本機機密（DB 密碼、Notion token）
```

---

## 開發指令

### 安裝

```bash
# 需 Node 20+
npm install
cp .env.example .env      # 填 Supabase anon key（僅內容瀏覽時可留空）
```

### 開發

```bash
npm run dev               # http://localhost:5173
```

### 建置與預覽

```bash
npm run build             # tsc -b && vite build → dist/
npm run preview           # 本機預覽 dist/
```

### 從 Notion 同步內容

```bash
# .env 需有 NOTION_TOKEN / NOTION_TRIPS_DB_ID / NOTION_ITINERARY_DB_ID
npm run sync:notion       # 產出 public/data/trips.json + <slug>/itinerary.json
```

---

## 資料來源

判斷原則：**你（管理者）自己編、所有人看到一樣的 → Notion；App 使用者在裝置上產生、每人不同、需登入 → Supabase。**

| 資料 | 來源 |
|------|------|
| 行程專案、每日行程、機票、住宿、交通票券、旅遊攻略、語言句庫 | **Notion**（`doc/Notion.md`） |
| 帳號、個人資料、記帳、分帳、平安回報、緊急求助、相簿、打包勾選、公告已讀 | **Supabase**（`doc/Database.md`） |
| 匯率 | 免費 API，同步時抓一次存 JSON（規劃中） |

---

## 程式碼風格和慣例

### 語言
- 註解、文件、UI 文案以**繁體中文**為主，必要時英文（技術術語、程式碼、外部引用）。

### React
- 一律**函式元件 + Hooks**，不使用 class 元件。
- 頁面元件放 `src/pages/`，每個對應一條路由。
- 資料抓取一律走 **TanStack Query**，`queryKey` 慣例：`["trips"]`、`["itinerary", slug]`、`["flights", slug]`…
- 內容讀取一律透過 `src/lib/content.ts` 的 `fetchXxx()`，不在元件內直接 `fetch`。
- Supabase 存取先判斷 `hasSupabase`，未設定金鑰時功能優雅停用，不可讓內容頁崩潰。

### 命名
- 元件檔與元件名：`PascalCase`（`TripPicker.tsx` → `TripPicker`）
- 函式 / 變數：`camelCase`
- 型別 / 介面：`PascalCase`（不加 `I` 前綴）
- 內容 JSON 欄位：`camelCase`（`tripSlug`、`mapUrl`、`startDate`）

### 樣式
- 全域樣式與 CSS 變數集中在 `src/index.css`，元件內用 `className` 或少量 inline style，不引入 CSS-in-JS。

---

## 專案文件（doc/）

- `doc/` 存放專案文件，未進版控（見 `.gitignore`），未來會陸續新增多份。
- `doc/Issue.md`：問題與說明的紀錄檔，採 **append-only 項次制**。
- `doc/Database.md`：Supabase 表結構、RLS、migration 紀錄。
- `doc/Notion.md`：Notion 內容後台的 database / 屬性 / view / 同步對照。
- `doc/secrets.local.md`：本機機密（DB 密碼、Notion token），**永遠不進版控**。

### doc/Issue.md 記錄規則
- 每則記錄是一個「**項次**」，編號遞增（001、002、003…）。
- **一律新增下一個項次，不修改、不刪除既有項次。**
- 若既有項次狀態有變動，只在該項次的「後續」欄位補記，不改動原文。
- 每個項次固定欄位：`日期` / `標題` / `狀態`（待處理 / 處理中 / 已解決 / 僅紀錄）/ `問題 / 背景` / `說明 / 解法` / `後續`。

### 給 Claude 的指示
- **只有在使用者明確說要寫進去時才寫**（例如「寫進 Issue」「記到 Issue.md」「加一則項次」）。平常問答一律只在對話中回答，不要主動寫入 `doc/Issue.md`。
- 收到明確指示時，依上述格式在 `doc/Issue.md` **檔尾新增下一個項次**（編號接續目前最大值）。
- 更新既有問題的進度時，找到對應項次，只在「後續」欄補記，不要重排或重編既有項次編號。

---

## 重要設定與注意事項

### 環境需求
- **Node.js 20 以上**（開發機實測 v24.19.0，位於 `C:\Program Files\nodejs`）。
- 瀏覽器內容瀏覽不需要任何金鑰；記帳 / 平安回報等功能需要 Supabase anon key。

### 環境變數（`.env`，不進版控）

| 變數 | 用途 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL（可公開） |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key（可公開，靠 RLS 保護） |
| `VITE_BASE` | GitHub Pages 子路徑（如 `/travel-app/`），本機留空 |
| `NOTION_TOKEN` | Notion internal integration secret（**機密**，僅同步腳本 / GitHub Secrets） |
| `NOTION_TRIPS_DB_ID` / `NOTION_ITINERARY_DB_ID` | 對應 Notion database ID |

### 部署（GitHub Pages）
1. Repo Settings → Pages → Source 選 **GitHub Actions**。
2. Repo Settings → Secrets 加 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`；同步用再加 `NOTION_TOKEN`、`NOTION_TRIPS_DB_ID`、`NOTION_ITINERARY_DB_ID`。
3. push 到 `main` → `deploy.yml` 自動 build，站台在 `https://<user>.github.io/<repo>/`。
4. `deploy.yml` 會把 `VITE_BASE` 設為 `/<repo>/`。

### Git 分支策略
- `main`：發佈分支，`deploy.yml` 於此觸發部署。
- 功能開發開 feature 分支，完成後合回 `main`。

### Git Commit 規範

- **兩階段流程**（見使用者全域指令）：使用者說「commit 標題」→ 只回覆建議標題 + 變更檔案清單，不執行 `git add` / `git commit`；使用者說「git commit」→ 才實際提交。
- 訊息格式：`<前綴>: <說明>`，前綴首字母大寫，說明用中文（Conventional Commits）。

| 前綴 | 用途 |
|------|------|
| `Feat:` | 新增功能 |
| `Fix:` | 修復 bug |
| `Refactor:` | 重構（不影響功能） |
| `Chore:` | 雜務（依賴更新、設定調整） |
| `Docs:` | 文件更新 |
| `Style:` | 格式調整（不影響邏輯） |
| `Test:` | 新增或修改測試 |
| `Perf:` | 效能優化 |
| `Ci:` | CI/CD 設定變更 |
| `Build:` | 建置系統或外部依賴變更 |

### 禁止事項
- 不要把 `.env`、`doc/`、`Sample/` 提交進版控（`.gitignore` 已排除）。
- 不要在前端程式碼引用 `NOTION_TOKEN` 或 Supabase `service_role` key。
- 不要讓前端直接呼叫 Notion API。
- 不要手改 `public/data/` 內由 Notion 同步產生的欄位（改 Notion 再 `npm run sync:notion`）。

### 注意事項
- `main.tsx` 用 `createHashRouter`：GitHub Pages 靜態站重新整理不會 404。
- `vite.config.ts` 的 `runtimeCaching` 對 `/data/` 用 NetworkFirst、對 `/images/` 用 CacheFirst，出國斷網仍可看已快取內容。
- Notion「時區JSON」欄位是 `label|tz;label|tz` 純文字（Notion API 不接受含大量引號的 JSON 字串），由 `sync-notion.ts` 解析。
- Notion 圖片連結約 1 小時過期，若要用圖片需自建 proxy / 轉存。
- 內容更新頻率 = `sync-notion.yml` 的 cron（每小時），非即時。
