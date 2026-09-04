import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHotels } from "../lib/content";

export default function Hotels() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["hotels", slug],
    queryFn: () => fetchHotels(slug)
  });

  if (isLoading) return <div className="empty">載入中…</div>;
  if (error || !data?.stays?.length)
    return <div className="empty">尚無住宿資料</div>;

  return (
    <>
      {data?.stays.map((h, i) => (
        <div className="card" key={i}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{h.name}</div>
          {h.area && <div className="muted" style={{ fontSize: 13 }}>{h.area}</div>}
          <div className="kv">
            <span>入住</span>
            <span>{h.checkIn}</span>
          </div>
          <div className="kv">
            <span>退房</span>
            <span>
              {h.checkOut}
              {h.nights ? ` · ${h.nights} 晚` : ""}
            </span>
          </div>
          {h.address && (
            <div className="kv">
              <span>地址</span>
              <span>{h.address}</span>
            </div>
          )}
          {h.mapUrl && (
            <div style={{ marginTop: 8 }}>
              <a href={h.mapUrl} target="_blank" rel="noreferrer">
                在地圖開啟 →
              </a>
            </div>
          )}
          {h.note && <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>{h.note}</div>}
        </div>
      ))}
    </>
  );
}
