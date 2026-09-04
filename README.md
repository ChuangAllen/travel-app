# Travel APP 專案文件

## 專案概述

### 專案名稱
**Travel APP** — 旅遊行程 Web / PWA

### 專案用途
- 多專案切換（第一頁選行程：沖繩 / 泰國 / 釜山…），進入後看該行程內容
- 每日行程瀏覽（逐時段、分類標記、Google 地圖連結、票券徽章）
- 機票 / 住宿 / 交通票券（如釜山 PASS）/ 乘車紀錄
- 旅遊攻略（簽證 / 入境 / 電壓 / 退稅 / 緊急聯絡）與語言小卡句庫
- 使用者功能（規劃中）：登入、記帳、分帳、平安回報、相簿上傳
- 離線可用（PWA，加入主畫面），出國斷網仍可看已快取內容
- 內容以 Notion 為後台，由 GitHub Actions 同步成靜態 JSON

---

## 技術架構

### 開發環境
- **建置工具**：Vite 5
- **框架**：React 18 + TypeScript
- **路由**：React Router 6（`HashRouter`）
- **資料抓取**：TanStack Query 5
- **PWA**：vite-plugin-pwa 0.20
- **使用者資料**：Supabase（PostgreSQL 17 + Auth + Storage）
- **內容後台**：Notion（`@notionhq/client`，僅同步腳本使用）
- **Node**：20+（開發機實測 v24）

### 系統架構

```mermaid
flowchart TB
    subgraph Content["內容（唯讀，管理者編輯）"]
        Notion["Notion 行程專案 / 每日行程 ..."]
        Sync["sync-notion.ts（Actions 每小時）"]
        JSON["public/data JSON"]
        Notion --> Sync --> JSON
    end

    subgraph Front["前端 React（GitHub Pages 靜態站）"]
        Pick["選行程頁"]
        Trip["行程內頁 首頁·行程·機票·住宿·交通·攻略·語言"]
        Pick --> Trip
    end

    subgraph User["使用者資料（App 內寫入）"]
        Supabase["Supabase expenses / splits / safety_reports / photos ... 全表 RLS"]
    end

    JSON -- "靜態檔 fetch" --> Front
    Front -- "supabase-js 直連" --> Supabase
```

---

## 核心結構

### 前端頁面模組

| 路由 | 元件 | 說明 |
|------|------|------|
| `/` | `TripPicker` | 讀 `trips.json`，選行程後存 `localStorage`，導向該行程首頁 |
| `/t/:slug` | `TripLayout` | 底部分頁殼、右上「切換行程」 |
| `/t/:slug/home` | `Home` | 當地 / 台北雙時鐘、今日行程、工具卡 |
| `/t/:slug/itinerary` | `Itinerary` | 每日行程，類型圖示 + Google 地圖連結 + 票券徽章 |
| `/t/:slug/flights` | `Flights` | 去 / 回程航班 |
| `/t/:slug/hotels` | `Hotels` | 住宿（入住 / 退房 / 地圖） |
| `/t/:slug/transport` | `Transport` | 票券、乘車紀錄、連結 |
| `/t/:slug/guide` | `Guide` | 旅遊攻略分節 |
| `/t/:slug/phrases` | `Phrases` | 語言小卡句庫 |

### 內容讀取流程

```mermaid
flowchart TD
    A["元件 useQuery"] --> B["lib/content.ts fetchXxx"]
    B --> C["fetch data 下的 slug JSON"]
    C --> D{"Service Worker"}
    D -- "有網路" --> E["NetworkFirst：取網路，更新快取"]
    D -- "斷網" --> F["回快取（最長 30 天）"]
    E --> G["TanStack Query 快取 60s"]
    F --> G
    G --> H["渲染"]
```

---

## 功能模組詳解

### 1. 多專案選擇

```mermaid
sequenceDiagram
    participant U as 使用者
    participant TP as TripPicker
    participant LS as localStorage
    participant TL as TripLayout

    U->>TP: 開啟 App
    TP->>TP: 讀 trips.json
    TP->>U: 顯示行程卡片（沖繩 / 泰國 / 釜山…）
    U->>TP: 點選行程
    TP->>LS: 寫入 selected-trip = slug
    TP->>TL: 導向該行程首頁
    Note over TL: 之後開 App 有 slug 就直接進該行程；右上「切換行程」回選單
```

- 每個行程一個 `slug`（如 `busan-2026`），對應 `public/data/<slug>/` 與 Supabase 的 `trip_slug`。
- 離線時 `trips.json` 與「選過的行程」JSON 皆已被 Service Worker 快取。

### 2. 每日行程

- 資料：`public/data/<slug>/itinerary.json`，`days[].items[]`。
- `type`：`transport` / `food` / `sightseeing` / `activity` / `shopping` / `hotel` / `note`，各有 emoji 圖示。
- `pass`：使用的票券名稱，顯示為徽章。
- `mapUrl`：Google 地圖連結，顯示「📍 在 Google 地圖開啟」。
- `Home` 的「今日行程」以今天日期比對 `days[].date`，找不到則顯示第 1 天。

### 3. 機票 / 住宿 / 交通 / 攻略 / 語言

| 頁面 | 資料檔 | 重點 |
|------|--------|------|
| 機票 | `flights.json` | 去 / 回程，`departLocal` / `arriveLocal` 用當地時間字串 |
| 住宿 | `hotels.json` | 入住 / 退房 / 晚數 / 地圖連結 |
| 交通 | `transport.json` | `passes`（票券）、`rides`（乘車）、`links` |
| 攻略 | `guide.json` | `sections[]` 分節條列 |
| 語言 | `phrases/<lang>.json` | 依 `trip.lang` 共用；`categories[].phrases[]`：中文 / 目標語 / 拼音 |

### 4. 使用者功能（Supabase，規劃中）

```mermaid
flowchart LR
    A["使用者登入 Supabase Auth"] --> B["記帳 expenses"]
    A --> C["分帳 expense_splits"]
    A --> D["平安回報 safety_reports"]
    A --> E["緊急求助 sos_events"]
    A --> F["相簿 photos + Storage"]
    B --> G[("PostgreSQL")]
    C --> G
    D --> G
    E --> G
    F --> G
    G -.- N["trip_slug 隔開行程；RLS 僅自己的資料"]
```

詳見 `doc/Database.md`。

---

## 內容同步架構（Notion → JSON）

```mermaid
flowchart TD
    subgraph Notion["Notion「Travel APP 內容」"]
        T["行程專案 / 每日行程 / 航班 / 住宿 / 交通票券 / 旅遊攻略 / 語言句庫"]
    end

    subgraph CI["GitHub Actions（sync-notion.yml，每小時 / 手動）"]
        S["sync-notion.ts（notionhq client）"]
    end

    T --> S
    S --> O1["trips.json + 各行程 JSON"]
    S --> O2["phrases 下的各語言 JSON"]
    O1 --> C["git commit + push"]
    O2 --> C
    C --> D["deploy.yml → GitHub Pages"]
```

- 前端**不直接呼叫 Notion API**（CORS + token 為機密），一律經 JSON。
- 「時區JSON」欄位為 `label|tz;label|tz` 純文字，由同步腳本解析。
- 內容（行程 / 航班 / 住宿 / 交通 / 攻略）依 `slug` 綁行程；語言句庫依 `lang`（`ko` / `ja` / `th` / `en`）共用。
- Notion 屬性 ↔ JSON 欄位對照見 `doc/Notion.md`。

---

## 資料庫（Supabase）

- 專案 region：`ap-northeast-2`（首爾）。
- 表：`profiles`、`trip_members`、`expenses`、`expense_splits`、`safety_reports`、`sos_events`、`photos`、`packing_checks`、`message_receipts`。
- 全表啟用 RLS，政策一律「只能存取自己的資料」（`user_id = auth.uid()`；`profiles` 用 `id`；`expense_splits` 用 `owner_user_id`）。
- 以 `trip_slug` 欄位隔開不同行程的個人資料。
- 完整欄位與 migration 紀錄見 `doc/Database.md`。

---

## 部署（GitHub Pages）

```mermaid
flowchart TD
    A["push 到 main"] --> B["deploy.yml 觸發"]
    B --> C["npm ci"]
    C --> D["npm run build（VITE_BASE = repo 子路徑）"]
    D --> E["upload-pages-artifact"]
    E --> F["deploy-pages"]
    F --> G["user.github.io 下的 repo 路徑"]
```

設定步驟：
1. Repo Settings → Pages → Source 選 **GitHub Actions**。
2. （可選）Repo Settings → Secrets 加 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。
3. push 到 `main` 即自動 build 部署。

> 內容同步目前是**本機手動**：`npm run sync:notion` 更新 `public/data/` → commit → push。
> 之後要改成 Actions 自動同步，見 `doc/Issue.md` 項次 004。

---

## 開發環境設定

### 必要軟體
1. **Node.js 20+**（開發機實測 v24.19.0）
2. **Git** 2.30+
3. 現代瀏覽器（Chrome / Edge / Safari）

### 安裝與啟動

```bash
npm install
cp .env.example .env      # 填 Supabase anon key（僅內容瀏覽可留空）
npm run dev               # http://localhost:5173
```

### 其他指令

```bash
npm run build             # tsc -b && vite build → dist/
npm run preview           # 本機預覽 dist/
npm run sync:notion       # 從 Notion 同步內容到 public/data/
```

---

## 目錄結構

```
Travel APP/
├── index.html
├── vite.config.ts               # base / PWA / runtimeCaching
├── package.json                 # dev / build / preview / sync:notion
├── .env.example
├── src/
│   ├── main.tsx                 # HashRouter + QueryClientProvider
│   ├── types.ts
│   ├── lib/                     # content.ts / supabase.ts / trip.ts
│   └── pages/                   # TripPicker / TripLayout / Home / Itinerary / ...
├── public/
│   ├── favicon.svg
│   └── data/                    # trips.json + <slug>/*.json
├── scripts/sync-notion.ts
├── examples/                    # 內容 JSON 範本 + schema 說明
├── .github/workflows/          # deploy.yml / sync-notion.yml
└── doc/                        # Issue.md / Database.md / Notion.md / secrets.local.md（不進版控）
```

### 關鍵檔案

| 檔案 | 說明 |
|------|------|
| `src/main.tsx` | 路由與 Provider 組裝 |
| `src/lib/content.ts` | 內容 JSON 讀取（所有頁面共用） |
| `src/lib/supabase.ts` | Supabase client（無金鑰時優雅停用） |
| `scripts/sync-notion.ts` | Notion → `public/data` 同步（目前**本機手動**跑，不在 Actions） |
| `vite.config.ts` | PWA 與離線快取策略 |
| `.github/workflows/deploy.yml` | GitHub Pages 部署（唯一的 workflow） |

---

## 文件維護

| 項目 | 內容 |
|------|------|
| 專案 | Travel APP（旅遊網頁 / APP） |
| 建立日期 | 2026-09-04 |
| 最後更新 | 2026-09-04 |
| 文件版本 | v1.0 |

相關文件：
- `doc/Issue.md` — 問題與決策紀錄（append-only 項次制）
- `doc/Database.md` — Supabase 表結構
- `doc/Notion.md` — Notion 內容後台結構
- `CLAUDE.md` — 開發指引與慣例
- `examples/README.md` — 內容 JSON schema 說明
