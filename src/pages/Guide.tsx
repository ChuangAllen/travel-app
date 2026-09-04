import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchGuide } from "../lib/content";

export default function Guide() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["guide", slug],
    queryFn: () => fetchGuide(slug)
  });

  if (isLoading) return <div className="empty">載入中…</div>;
  if (error || !data?.sections?.length)
    return <div className="empty">尚無攻略資料</div>;

  return (
    <>
      {data?.sections.map((s) => (
        <div className="card" key={s.key}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
          {s.items.map((it, i) => (
            <div key={i} style={{ fontSize: 14, padding: "3px 0" }}>
              ・{it}
            </div>
          ))}
        </div>
      ))}
      {data?.reminder && (
        <div className="muted" style={{ padding: "4px 6px" }}>
          {data.reminder}
        </div>
      )}
    </>
  );
}
