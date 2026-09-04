import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchItinerary } from "../lib/content";
import type { ItineraryItemType } from "../types";

const dot: Record<ItineraryItemType, string> = {
  transport: "🚕",
  food: "🍽️",
  sightseeing: "📷",
  activity: "🎡",
  shopping: "🛍️",
  hotel: "🏨",
  note: "📌"
};

export default function Itinerary() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["itinerary", slug],
    queryFn: () => fetchItinerary(slug)
  });

  if (isLoading) return <div className="empty">載入中…</div>;
  if (error) return <div className="empty">讀取行程失敗</div>;

  return (
    <>
      {data?.days.map((d) => (
        <div key={d.day}>
          <div className="day-head">
            <span className="d">Day{d.day}</span>
            <span className="t">
              {d.date}
              {d.weekday ? `(${d.weekday})` : ""} · {d.title}
            </span>
          </div>
          <div className="card">
            {d.items.map((it, i) => (
              <div className="item" key={i}>
                <div className="time">{it.time}</div>
                <div className="body">
                  <div className="title">
                    <span className="type-dot">{dot[it.type]}</span>
                    {it.title}
                    {it.pass && <span className="badge">{it.pass}</span>}
                  </div>
                  {it.note && <div className="note">{it.note}</div>}
                  {it.mapUrl && (
                    <a
                      className="note"
                      href={it.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent)" }}
                    >
                      📍 在 Google 地圖開啟
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
