import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchTrips } from "../lib/content";
import { setSelectedTrip } from "../lib/trip";
import type { Trip } from "../types";

const statusText: Record<Trip["status"], string> = {
  upcoming: "準備中",
  ongoing: "進行中",
  ended: "已結束"
};

export default function TripPicker() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips
  });

  function pick(slug: string) {
    setSelectedTrip(slug);
    navigate(`/t/${slug}/home`);
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <h1>選擇行程</h1>
          <div className="sub">Travel APP</div>
        </div>
      </div>
      <div className="content">
        {isLoading && <div className="empty">載入中…</div>}
        {error && <div className="empty">讀取行程清單失敗</div>}
        {data?.map((t) => (
          <div
            key={t.slug}
            className="card trip-card"
            role="button"
            tabIndex={0}
            onClick={() => pick(t.slug)}
            onKeyDown={(e) => e.key === "Enter" && pick(t.slug)}
          >
            <div className="cover">{t.emoji ?? "🧳"}</div>
            <div className="body">
              <div className="name">
                {t.name}
                <span className="badge">{statusText[t.status]}</span>
              </div>
              <div className="meta">
                {t.startDate} – {t.endDate} · {t.cities.join("、")}
              </div>
            </div>
          </div>
        ))}
        {data && data.length === 0 && (
          <div className="empty">還沒有任何行程</div>
        )}
      </div>
    </div>
  );
}
