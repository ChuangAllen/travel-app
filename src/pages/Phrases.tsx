import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTrips, fetchPhrases } from "../lib/content";
import type { Lang } from "../types";

const LANG_LABEL: Record<Lang, string> = {
  ko: "韓語",
  ja: "日語",
  th: "泰語",
  en: "英語"
};

interface Picked {
  catLabel: string;
  zh: string;
  target: string;
  roman?: string;
}

export default function Phrases() {
  const { slug = "" } = useParams();
  const { data: trips } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });
  const lang = (trips?.find((t) => t.slug === slug)?.lang ?? "en") as Lang;

  const { data, isLoading, error } = useQuery({
    queryKey: ["phrases", lang],
    queryFn: () => fetchPhrases(lang),
    enabled: Boolean(trips)
  });

  const [activeCat, setActiveCat] = useState(0);
  const [picked, setPicked] = useState<Picked[]>([]);

  const cats = data?.categories ?? [];
  const current = cats[activeCat];

  const canAdd = picked.length < 3;
  function add(catLabel: string, p: { zh: string; target: string; roman?: string }) {
    if (!canAdd) return;
    if (picked.some((x) => x.target === p.target)) return;
    setPicked((prev) => [...prev, { catLabel, ...p }]);
  }
  function removeAt(i: number) {
    setPicked((prev) => prev.filter((_, idx) => idx !== i));
  }

  const langLabel = useMemo(() => LANG_LABEL[lang], [lang]);

  if (isLoading) return <div className="empty">載入中…</div>;
  if (error || !cats.length)
    return <div className="empty">尚無{langLabel}句庫</div>;

  return (
    <>
      <div className="muted" style={{ padding: "2px 4px 10px", fontSize: 13 }}>
        {langLabel}小卡 · 點下方句子加到卡片（最多 3 句），一次拿給對方看
      </div>

      {/* 組合區 */}
      <div
        className="card"
        style={{
          border: "2px solid var(--accent)",
          minHeight: 96,
          background: "color-mix(in srgb, var(--accent) 8%, var(--card))"
        }}
      >
        {picked.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: "24px 8px" }}>
            點下面的句子加到這裡
          </div>
        ) : (
          picked.map((p, i) => (
            <div
              key={i}
              style={{
                padding: "10px 0",
                borderBottom:
                  i < picked.length - 1 ? "1px dashed var(--sand)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8
              }}
            >
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {p.catLabel}｜{p.zh}
                  {p.roman ? ` · ${p.roman}` : ""}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                  {p.target}
                </div>
              </div>
              <button
                className="btn"
                style={{ padding: "2px 8px", flex: "none" }}
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "8px 4px"
        }}
      >
        <span className="muted" style={{ fontSize: 12 }}>
          點下方句子加到卡片，點卡片內句子可移除
        </span>
        {picked.length > 0 && (
          <button className="btn" onClick={() => setPicked([])}>
            清除
          </button>
        )}
      </div>

      {/* 分類 + 句子 */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
          {cats.map((c, i) => (
            <button
              key={c.key}
              className={i === activeCat ? "btn btn-primary" : "btn"}
              style={{ borderRadius: 12, padding: "8px 12px" }}
              onClick={() => setActiveCat(i)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            alignContent: "start"
          }}
        >
          {current?.phrases.map((p, i) => {
            const chosen = picked.some((x) => x.target === p.target);
            return (
              <button
                key={i}
                className="card"
                disabled={!canAdd && !chosen}
                style={{
                  padding: "12px 10px",
                  margin: 0,
                  textAlign: "left",
                  cursor: canAdd || chosen ? "pointer" : "not-allowed",
                  opacity: chosen ? 0.5 : 1,
                  border: chosen ? "1px solid var(--accent)" : undefined
                }}
                onClick={() => add(current.label, p)}
              >
                <div style={{ fontSize: 14 }}>{p.zh}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {p.target}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
