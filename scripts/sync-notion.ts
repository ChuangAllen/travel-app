/**
 * 從 Notion 同步內容 → public/data/
 *
 * 用法:
 *   1. 複製 .env.example 為 .env,填 NOTION_TOKEN 與各 DB ID
 *   2. npm run sync:notion
 *
 * GitHub Actions 會用同一支腳本(見 .github/workflows/sync-notion.yml)。
 *
 * Notion 結構(「Travel APP 內容」頁底下,見 doc/Notion.md):
 *   行程專案   → trips.json                         (含 lang)
 *   每日行程   → <slug>/itinerary.json
 *   航班       → <slug>/flights.json
 *   住宿       → <slug>/hotels.json
 *   交通票券   → <slug>/transport.json
 *   旅遊攻略   → <slug>/guide.json
 *   語言句庫   → phrases/<lang>.json                (依語言共用,不綁行程)
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error("缺少 NOTION_TOKEN");
  process.exit(1);
}
const notion = new Client({ auth: token });

const DB = {
  trips: requireEnv("NOTION_TRIPS_DB_ID"),
  itinerary: requireEnv("NOTION_ITINERARY_DB_ID"),
  flights: process.env.NOTION_FLIGHTS_DB_ID,
  hotels: process.env.NOTION_HOTELS_DB_ID,
  transport: process.env.NOTION_TRANSPORT_DB_ID,
  guide: process.env.NOTION_GUIDE_DB_ID,
  phrases: process.env.NOTION_PHRASES_DB_ID
};
const OUT = join(process.cwd(), "public", "data");

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`缺少 ${name}`);
    process.exit(1);
  }
  return v;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const txt = (p: any): string =>
  (p?.title ?? p?.rich_text ?? [])
    .map((t: any) => t.plain_text)
    .join("")
    .trim();
const sel = (p: any): string => p?.select?.name ?? "";
const num = (p: any): number | undefined =>
  typeof p?.number === "number" ? p.number : undefined;
const url = (p: any): string => p?.url ?? "";
const dStart = (p: any): string => p?.date?.start ?? "";
const dEnd = (p: any): string => p?.date?.end ?? "";
const bool = (p: any): boolean => Boolean(p?.checkbox);
const splitList = (s: string): string[] =>
  s
    .split(/[、,，\n／/]/)
    .map((x) => x.trim())
    .filter(Boolean);

async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = 1000 * 2 ** i;
      console.warn(`  重試 ${i + 1}/${tries}(等 ${wait}ms)…`, (e as Error)?.message ?? e);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function queryAll(database_id: string, sorts?: any[]) {
  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await withRetry(() =>
      notion.databases.query({ database_id, start_cursor: cursor, sorts, page_size: 100 })
    );
    rows.push(...res.results);
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return rows;
}

async function writeJson(relPath: string, data: unknown) {
  const full = join(OUT, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("寫入", relPath);
}

/** 把有 專案slug 的列依 slug 分組 */
function groupBySlug(rows: any[]): Map<string, any[]> {
  const m = new Map<string, any[]>();
  for (const r of rows) {
    const slug = txt(r.properties["專案slug"]);
    if (!slug) continue;
    (m.get(slug) ?? m.set(slug, []).get(slug)!).push(r);
  }
  return m;
}

const bySort = (a: any, b: any) =>
  (num(a.properties["排序"]) ?? 0) - (num(b.properties["排序"]) ?? 0);

async function syncTrips() {
  const rows = await queryAll(DB.trips);
  const trips = rows
    .map((r) => {
      const p = r.properties;
      return {
        slug: txt(p["slug"]),
        name: txt(p["名稱"]),
        subtitle: txt(p["副標題"]) || undefined,
        emoji: txt(p["emoji"]) || undefined,
        lang: sel(p["語言"]) || "en",
        startDate: dStart(p["期間"]),
        endDate: dEnd(p["期間"]) || dStart(p["期間"]),
        cities: splitList(txt(p["城市"])),
        timezones: txt(p["時區JSON"])
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((pair) => {
            const [label, tz] = pair.split("|").map((x) => x.trim());
            return { label, tz };
          })
          .filter((z) => z.label && z.tz),
        cover: txt(p["封面"]) || undefined,
        status: (sel(p["狀態"]) || "upcoming") as "upcoming" | "ongoing" | "ended"
      };
    })
    .filter((t) => t.slug)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  await writeJson("trips.json", trips);
  return trips;
}

async function syncItinerary() {
  const rows = await queryAll(DB.itinerary);
  const bySlug = new Map<string, Map<number, any>>();
  for (const r of rows) {
    const p = r.properties;
    const slug = txt(p["專案slug"]);
    if (!slug || bool(p["略過"])) continue;
    const day = num(p["Day"]) ?? 1;
    if (!bySlug.has(slug)) bySlug.set(slug, new Map());
    const days = bySlug.get(slug)!;
    if (!days.has(day)) {
      days.set(day, {
        day,
        date: dStart(p["日期"]),
        weekday: txt(p["星期"]) || undefined,
        title: txt(p["當日主題"]),
        items: []
      });
    }
    const d = days.get(day)!;
    if (!d.date) d.date = dStart(p["日期"]);
    if (!d.weekday) d.weekday = txt(p["星期"]) || undefined;
    if (!d.title) d.title = txt(p["當日主題"]);
    const item: any = { time: txt(p["時間"]), type: sel(p["類型"]) || "note", title: txt(p["標題"]) };
    if (txt(p["備註"])) item.note = txt(p["備註"]);
    if (txt(p["票券"])) item.pass = txt(p["票券"]);
    if (url(p["地圖"])) item.mapUrl = url(p["地圖"]);
    if (url(p["連結"])) item.link = url(p["連結"]);
    d.items.push(item);
  }
  for (const [slug, days] of bySlug) {
    await writeJson(`${slug}/itinerary.json`, {
      tripSlug: slug,
      days: [...days.values()]
        .sort((a, b) => a.day - b.day)
        .map((d) => ({ ...d, items: d.items.sort((a: any, b: any) => a.time.localeCompare(b.time)) }))
    });
  }
}

async function syncFlights() {
  if (!DB.flights) return console.log("略過 flights(未設 NOTION_FLIGHTS_DB_ID)");
  const rows = await queryAll(DB.flights);
  for (const [slug, list] of groupBySlug(rows)) {
    await writeJson(`${slug}/flights.json`, {
      tripSlug: slug,
      segments: list.sort(bySort).map((r) => {
        const p = r.properties;
        const seg: any = {
          kind: sel(p["種類"]) || "outbound",
          flightNo: txt(p["航班編號"]),
          airline: txt(p["航空公司"]) || undefined,
          from: { code: txt(p["出發地代碼"]), name: txt(p["出發地名稱"]) },
          to: { code: txt(p["抵達地代碼"]), name: txt(p["抵達地名稱"]) },
          departLocal: txt(p["出發時間"]),
          arriveLocal: txt(p["抵達時間"])
        };
        if (txt(p["備註"])) seg.note = txt(p["備註"]);
        return seg;
      })
    });
  }
}

async function syncHotels() {
  if (!DB.hotels) return console.log("略過 hotels(未設 NOTION_HOTELS_DB_ID)");
  const rows = await queryAll(DB.hotels);
  for (const [slug, list] of groupBySlug(rows)) {
    await writeJson(`${slug}/hotels.json`, {
      tripSlug: slug,
      stays: list.sort(bySort).map((r) => {
        const p = r.properties;
        const s: any = {
          name: txt(p["名稱"]),
          area: txt(p["區域"]) || undefined,
          checkIn: dStart(p["入住"]),
          checkOut: dStart(p["退房"]),
          nights: num(p["晚數"]),
          address: txt(p["地址"]) || undefined,
          mapUrl: url(p["地圖"]) || undefined,
          note: txt(p["備註"]) || undefined
        };
        return s;
      })
    });
  }
}

async function syncTransport() {
  if (!DB.transport) return console.log("略過 transport(未設 NOTION_TRANSPORT_DB_ID)");
  const rows = await queryAll(DB.transport);
  for (const [slug, list] of groupBySlug(rows)) {
    const sorted = list.sort(bySort);
    const passes = sorted
      .filter((r) => sel(r.properties["類別"]) === "pass")
      .map((r) => {
        const p = r.properties;
        return {
          name: txt(p["標題"]),
          note: txt(p["說明"]) || undefined,
          usedFor: splitList(txt(p["涵蓋景點"]))
        };
      });
    const rides = sorted
      .filter((r) => sel(r.properties["類別"]) === "ride")
      .map((r) => {
        const p = r.properties;
        return {
          date: dStart(p["日期"]),
          mode: txt(p["交通方式"]),
          from: txt(p["出發"]),
          to: txt(p["抵達"]),
          fare: txt(p["費用"]) || undefined,
          note: txt(p["備註"]) || undefined
        };
      });
    const links = sorted
      .filter((r) => sel(r.properties["類別"]) === "link")
      .map((r) => ({ label: txt(r.properties["標題"]), url: url(r.properties["連結"]) }));
    await writeJson(`${slug}/transport.json`, { tripSlug: slug, passes, rides, links });
  }
}

async function syncGuide() {
  if (!DB.guide) return console.log("略過 guide(未設 NOTION_GUIDE_DB_ID)");
  const rows = await queryAll(DB.guide);
  for (const [slug, list] of groupBySlug(rows)) {
    const sorted = list.sort(bySort);
    const order: string[] = [];
    const secs = new Map<string, { key: string; label: string; items: string[] }>();
    for (const r of sorted) {
      const p = r.properties;
      const key = txt(p["分節key"]) || "misc";
      if (!secs.has(key)) {
        secs.set(key, { key, label: txt(p["分節標籤"]) || key, items: [] });
        order.push(key);
      }
      secs.get(key)!.items.push(txt(p["項目"]));
    }
    await writeJson(`${slug}/guide.json`, {
      tripSlug: slug,
      sections: order.map((k) => secs.get(k)!)
    });
  }
}

const PHRASE_CATEGORY_LABEL: Record<string, string> = {
  basic: "基本",
  transport: "交通",
  place: "地點",
  sightseeing: "景點",
  facility: "設施",
  food: "餐飲",
  shopping: "購物",
  lodging: "住宿",
  emergency: "緊急"
};

async function syncPhrases() {
  if (!DB.phrases) return console.log("略過 phrases(未設 NOTION_PHRASES_DB_ID)");
  const rows = await queryAll(DB.phrases);
  const byLang = new Map<string, any[]>();
  for (const r of rows) {
    const lang = sel(r.properties["語言"]);
    if (!lang) continue;
    (byLang.get(lang) ?? byLang.set(lang, []).get(lang)!).push(r);
  }
  for (const [lang, list] of byLang) {
    list.sort(bySort);
    const order: string[] = [];
    const cats = new Map<string, { key: string; label: string; phrases: any[] }>();
    for (const r of list) {
      const p = r.properties;
      const key = sel(p["分類"]) || "basic";
      if (!cats.has(key)) {
        cats.set(key, { key, label: PHRASE_CATEGORY_LABEL[key] ?? key, phrases: [] });
        order.push(key);
      }
      const ph: any = { zh: txt(p["中文"]), target: txt(p["目標語"]) };
      if (txt(p["拼音"])) ph.roman = txt(p["拼音"]);
      cats.get(key)!.phrases.push(ph);
    }
    await writeJson(`phrases/${lang}.json`, {
      lang,
      categories: order.map((k) => cats.get(k)!)
    });
  }
}

async function main() {
  await syncTrips();
  await syncItinerary();
  await syncFlights();
  await syncHotels();
  await syncTransport();
  await syncGuide();
  await syncPhrases();
  console.log("完成。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
