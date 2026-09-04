import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTransport } from "../lib/content";

export default function Transport() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["transport", slug],
    queryFn: () => fetchTransport(slug)
  });

  if (isLoading) return <div className="empty">載入中…</div>;
  const isEmpty =
    !data ||
    (!data.passes.length && !data.rides.length && !data.links.some((l) => l.url));
  if (error || isEmpty) return <div className="empty">尚無交通資料</div>;

  return (
    <>
      {data && data.passes.length > 0 && (
        <>
          <div className="section-title">票券</div>
          {data.passes.map((p, i) => (
            <div className="card" key={i}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              {p.note && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{p.note}</div>}
              {p.usedFor && p.usedFor.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.usedFor.map((u) => (
                    <span className="badge" key={u}>{u}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {data && data.rides.length > 0 && (
        <>
          <div className="section-title">乘車紀錄</div>
          {data.rides.map((r, i) => (
            <div className="card" key={i}>
              <div style={{ fontWeight: 600 }}>
                {r.from} → {r.to}
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {r.date} · {r.mode}
                {r.fare ? ` · ${r.fare}` : ""}
              </div>
              {r.note && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.note}</div>}
            </div>
          ))}
        </>
      )}

      {data && data.links.some((l) => l.url) && (
        <>
          <div className="section-title">連結</div>
          <div className="card">
            {data.links
              .filter((l) => l.url)
              .map((l, i) => (
                <div className="kv" key={i}>
                  <span>{l.label}</span>
                  <a href={l.url} target="_blank" rel="noreferrer">開啟 →</a>
                </div>
              ))}
          </div>
        </>
      )}
    </>
  );
}
