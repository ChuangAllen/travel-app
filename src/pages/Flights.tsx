import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights } from "../lib/content";

export default function Flights() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["flights", slug],
    queryFn: () => fetchFlights(slug)
  });

  if (isLoading) return <div className="empty">載入中…</div>;
  if (error || !data?.segments?.length)
    return <div className="empty">尚無機票資料</div>;

  return (
    <>
      {data?.segments.map((s, i) => (
        <div className="card" key={i}>
          <div className="muted" style={{ fontSize: 12 }}>
            {s.kind === "outbound" ? "去程" : "回程"} · {s.flightNo}
            {s.airline ? ` · ${s.airline}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 8
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.from.code}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {s.from.name}
              </div>
              <div style={{ marginTop: 6 }}>{s.departLocal}</div>
            </div>
            <div className="muted">✈️</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.to.code}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {s.to.name}
              </div>
              <div style={{ marginTop: 6 }}>{s.arriveLocal}</div>
            </div>
          </div>
        </div>
      ))}
      {data?.note && <div className="muted" style={{ padding: "4px 6px" }}>{data.note}</div>}
    </>
  );
}
