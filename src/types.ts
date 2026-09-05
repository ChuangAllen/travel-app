export type TripStatus = "upcoming" | "ongoing" | "ended";
export type Lang = "ko" | "ja" | "th" | "en";

export interface Trip {
  slug: string;
  name: string;
  subtitle?: string;
  emoji?: string;
  lang: Lang;
  startDate: string;
  endDate: string;
  cities: string[];
  timezones: { label: string; tz: string }[];
  cover?: string;
  status: TripStatus;
}

export type ItineraryItemType =
  | "transport"
  | "food"
  | "sightseeing"
  | "activity"
  | "shopping"
  | "hotel"
  | "note"
  | "route";

export interface ItineraryItem {
  time: string;
  type: ItineraryItemType;
  title: string;
  note?: string;
  pass?: string;
  /** type=route:總車程,如「1小時26分」 */
  duration?: string;
  mapUrl?: string;
  link?: string;
}

export interface DayImage {
  /** Supabase Storage「trip-images」bucket 物件路徑 <slug>/<檔名>(需簽章)或外部 URL(直接用) */
  src: string;
  /** 圖片說明,無則不顯示 */
  caption?: string;
  /** 點圖開啟的連結,無則圖片不可點擊 */
  link?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  weekday?: string;
  title: string;
  items: ItineraryItem[];
  /** 該日插圖(可多張),來源:Notion「每日圖片」資料庫 */
  images?: DayImage[];
}

export interface Itinerary {
  tripSlug: string;
  days: ItineraryDay[];
}

export interface FlightSegment {
  kind: "outbound" | "return";
  flightNo: string;
  airline?: string;
  from: { code: string; name: string };
  to: { code: string; name: string };
  departLocal: string;
  arriveLocal: string;
}

export interface Flights {
  tripSlug: string;
  note?: string;
  segments: FlightSegment[];
}

export interface HotelStay {
  name: string;
  area?: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  address?: string;
  mapUrl?: string;
  note?: string;
}

export interface Hotels {
  tripSlug: string;
  stays: HotelStay[];
}

export interface Transport {
  tripSlug: string;
  passes: { name: string; note?: string; usedFor?: string[] }[];
  rides: {
    date: string;
    mode: string;
    from: string;
    to: string;
    fare?: string;
    note?: string;
  }[];
  links: { label: string; url: string }[];
}

export interface Guide {
  tripSlug: string;
  sections: { key: string; label: string; items: string[] }[];
  reminder?: string;
}

export type NoteStatus = "done" | "todo" | "cancelled";

export interface NoteItem {
  title: string;
  status: NoteStatus;
  detail?: string;
}

export interface TripNotes {
  tripSlug: string;
  notes: NoteItem[];
}

export interface Phrases {
  lang: Lang;
  categories: {
    key: string;
    label: string;
    phrases: { zh: string; target: string; roman?: string }[];
  }[];
}
