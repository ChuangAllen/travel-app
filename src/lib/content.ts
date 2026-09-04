import type {
  Trip,
  Itinerary,
  Flights,
  Hotels,
  Transport,
  Guide,
  Phrases,
  TripNotes
} from "../types";

const BASE = import.meta.env.BASE_URL; // 尊重 vite base(GitHub Pages 子路徑)

/** 靜態資產路徑:外部 URL 原樣回傳,相對路徑補上 BASE(例:images/xxx/day1.jpg) */
export const assetUrl = (p?: string): string | undefined =>
  !p ? undefined : /^https?:\/\//.test(p) ? p : `${BASE}${p}`;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`讀取失敗 ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const fetchTrips = () => getJson<Trip[]>("trips.json");
export const fetchItinerary = (slug: string) =>
  getJson<Itinerary>(`${slug}/itinerary.json`);
export const fetchFlights = (slug: string) =>
  getJson<Flights>(`${slug}/flights.json`);
export const fetchHotels = (slug: string) =>
  getJson<Hotels>(`${slug}/hotels.json`);
export const fetchTransport = (slug: string) =>
  getJson<Transport>(`${slug}/transport.json`);
export const fetchGuide = (slug: string) => getJson<Guide>(`${slug}/guide.json`);
// 行前筆記:該行程沒有筆記時檔案不存在,回 null 讓前端略過
export const fetchNotes = async (slug: string): Promise<TripNotes | null> => {
  try {
    return await getJson<TripNotes>(`${slug}/notes.json`);
  } catch {
    return null;
  }
};
// 句庫依語言共用,不綁行程
export const fetchPhrases = (lang: string) =>
  getJson<Phrases>(`phrases/${lang}.json`);
