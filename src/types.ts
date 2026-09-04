export type TripStatus = "upcoming" | "ongoing" | "ended";
export type Lang = "ko" | "ja" | "th" | "en";

export interface Trip {
  slug: string;
  name: string;
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
  | "note";

export interface ItineraryItem {
  time: string;
  type: ItineraryItemType;
  title: string;
  note?: string;
  pass?: string;
  mapUrl?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  weekday?: string;
  title: string;
  items: ItineraryItem[];
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

export interface Phrases {
  lang: Lang;
  categories: {
    key: string;
    label: string;
    phrases: { zh: string; target: string; roman?: string }[];
  }[];
}
