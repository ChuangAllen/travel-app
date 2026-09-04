import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTrips, fetchItinerary } from "../lib/content";
import { hasSupabase } from "../lib/supabase";

function localTime(tz: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
    hour12: false
  }).format(new Date());
}

export default function Home() {
  const { slug = "" } = useParams();
  const { data: trips } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });
  const trip = trips?.find((t) => t.slug === slug);
  const { data: itin } = useQuery({
    queryKey: ["itinerary", slug],
    queryFn: () => fetchItinerary(slug)
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayDay =
    itin?.days.find((d) => d.date === today) ?? itin?.days[0];

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {trip?.timezones.map((z) => (
            <div key={z.tz}>
              <div className="muted" style={{ fontSize: 12 }}>
                {z.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {localTime(z.tz)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">今日行程</div>
      <div className="card">
        {todayDay ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Day{todayDay.day} · {todayDay.date}
              {todayDay.weekday ? `(${todayDay.weekday})` : ""} · {todayDay.title}
            </div>
            {todayDay.items.slice(0, 6).map((it, i) => (
              <div className="item" key={i}>
                <div className="time">{it.time}</div>
                <div className="body">
                  <div className="title">{it.title}</div>
                  {it.note && <div className="note">{it.note}</div>}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="muted">尚無行程資料</div>
        )}
      </div>

      <div className="section-title">工具</div>
      <div className="card">
        <div className="kv">
          <span>記帳 / 分帳 / 平安回報</span>
          <span className="muted">
            {hasSupabase ? "已就緒" : "待設定 Supabase 金鑰"}
          </span>
        </div>
        <div className="kv">
          <span>最後同步</span>
          <span className="muted">內容來自 /data/{slug}/</span>
        </div>
      </div>
    </>
  );
}
