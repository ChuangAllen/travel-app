import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchItinerary } from "../lib/content";
import { signedImageUrls } from "../lib/images";
import type { ItineraryDay, ItineraryItemType } from "../types";

const dot: Record<ItineraryItemType, string> = {
  transport: "🚕",
  food: "🍽️",
  sightseeing: "📷",
  activity: "🎡",
  shopping: "🛍️",
  hotel: "🏨",
  note: "📌",
  route: "🔁"
};

function mdLabel(date: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(date);
  return m ? `${Number(m[1])}/${Number(m[2])}` : date;
}

function linkLabel(u: string, isRoute = false): string {
  const isMap = /maps\.app\.goo\.gl|google\.[^/]+\/maps/i.test(u);
  if (isRoute && isMap) return "🗺 路線";
  if (isMap) return "🗺 Google 地圖";
  if (/naver\./i.test(u)) return "🗺 Naver 地圖";
  return "🔗 開啟連結";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function DayBlock({
  day,
  imageUrls
}: {
  day: ItineraryDay;
  imageUrls: Record<string, string> | undefined;
}) {
  return (
    <div>
      <div className="day-head">
        <span className="d">Day{day.day}</span>
        <span className="t">
          {day.date}
          {day.weekday ? `(${day.weekday})` : ""}
          {day.title ? ` · ${day.title}` : ""}
        </span>
      </div>
      <div className="card">
        {day.items.map((it, i) => (
          <div className={it.type === "route" ? "item route" : "item"} key={i}>
            <div className="time">{it.time}</div>
            <div className="body">
              <div className="title">
                <span className="type-dot">{dot[it.type]}</span>
                {it.title}
                {it.pass && <span className="badge">{it.pass}</span>}
                {it.type === "route" && it.duration && (
                  <span className="badge dur">🕒 {it.duration}</span>
                )}
              </div>
              {it.note && <div className="note">{it.note}</div>}
              {(it.mapUrl || it.link) && (
                <div className="item-links">
                  {it.mapUrl && (
                    <a href={it.mapUrl} target="_blank" rel="noreferrer">
                      📍 在 Google 地圖開啟
                    </a>
                  )}
                  {it.link && (
                    <a href={it.link} target="_blank" rel="noreferrer">
                      {linkLabel(it.link, it.type === "route")}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {day.images?.map((img, i) => {
        const url = imageUrls?.[img.src];
        if (!url) return null; // 簽章網址尚未取得(或無權限):不顯示壞圖
        const photo = (
          <img
            className="day-photo"
            src={url}
            alt={img.caption || `Day${day.day} ${day.title} ${i + 1}`}
            loading="lazy"
          />
        );
        return (
          <div className="day-photo-block" key={i}>
            {img.link ? (
              <a href={img.link} target="_blank" rel="noreferrer">
                {photo}
              </a>
            ) : (
              photo
            )}
            {img.caption && <div className="day-photo-caption">{img.caption}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function Itinerary() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["itinerary", slug],
    queryFn: () => fetchItinerary(slug)
  });

  const days = data?.days ?? [];
  const defaultDay = useMemo(() => {
    const today = todayStr();
    const hit = days.find((d) => d.date === today);
    return hit?.day ?? days[0]?.day ?? 1;
  }, [days]);

  // null = 尚未選擇(用預設當天);"all" = 顯示全部
  const [selected, setSelected] = useState<number | "all" | null>(null);

  const active: number | "all" = selected ?? defaultDay;
  const shownDays =
    active === "all" ? days : days.filter((d) => d.day === active);
  const selectValue = active === "all" ? "all" : String(active);

  const imagePaths = useMemo(
    () =>
      Array.from(
        new Set(shownDays.flatMap((d) => d.images?.map((i) => i.src) ?? []))
      ),
    [shownDays]
  );
  const { data: imageUrls } = useQuery({
    queryKey: ["day-images", slug, imagePaths],
    queryFn: () => signedImageUrls(imagePaths),
    enabled: imagePaths.length > 0,
    staleTime: 50 * 60 * 1000 // 簽章網址效期 1 小時,略短時間內視為新鮮
  });

  if (isLoading) return <div className="empty">載入中…</div>;
  if (error) return <div className="empty">讀取行程失敗</div>;
  if (!days.length) return <div className="empty">尚無行程內容</div>;

  return (
    <>
      <div className="day-picker">
        <select
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            setSelected(v === "all" ? "all" : Number(v));
          }}
        >
          {days.map((d) => (
            <option key={d.day} value={d.day}>
              Day{d.day} · {mdLabel(d.date)}
              {d.weekday ? `（${d.weekday}）` : ""}
            </option>
          ))}
          <option value="all">全部行程</option>
        </select>
      </div>

      {(shownDays.length ? shownDays : days).map((d) => (
        <DayBlock key={d.day} day={d} imageUrls={imageUrls} />
      ))}
    </>
  );
}
