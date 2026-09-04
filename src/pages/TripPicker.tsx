import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchTrips } from "../lib/content";
import { fetchMyAccess } from "../lib/members";
import { setSelectedTrip } from "../lib/trip";
import { useAuth } from "../lib/auth";
import type { Trip } from "../types";

type Phase = "ongoing" | "upcoming" | "ended";

const SECTIONS: { phase: Phase; label: string }[] = [
  { phase: "ongoing", label: "旅程中" },
  { phase: "upcoming", label: "即將開始" },
  { phase: "ended", label: "已結束" }
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function phaseOf(t: Trip): Phase {
  const today = todayStr();
  if (today < t.startDate) return "upcoming";
  if (today > t.endDate) return "ended";
  return "ongoing";
}

export default function TripPicker() {
  const navigate = useNavigate();
  const { user, authEnabled, signOut } = useAuth();

  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });
  const accessQuery = useQuery({
    queryKey: ["my-access", user?.id],
    queryFn: fetchMyAccess,
    enabled: authEnabled
  });

  // 有帳號功能時,一定要等權限回來才顯示,避免先閃過全部行程
  const authResolved = !authEnabled || accessQuery.isSuccess;
  const loading = tripsQuery.isLoading || !authResolved;

  const access = accessQuery.data; // TripAccess | null | undefined
  const allTrips = tripsQuery.data ?? [];
  const visible: Trip[] = !authEnabled
    ? allTrips
    : access == null
      ? [] // 已啟用帳號但拿不到權限 → 不顯示任何行程
      : access.all
        ? allTrips
        : allTrips.filter((t) => access.slugs.includes(t.slug));

  const groups = new Map<Phase, Trip[]>();
  for (const t of visible) {
    const p = phaseOf(t);
    (groups.get(p) ?? groups.set(p, []).get(p)!).push(t);
  }
  for (const [p, list] of groups) {
    list.sort((a, b) =>
      p === "ended"
        ? b.startDate.localeCompare(a.startDate)
        : a.startDate.localeCompare(b.startDate)
    );
  }

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
        {authEnabled && user && (
          <button
            className="btn"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
          >
            登出
          </button>
        )}
      </div>
      <div className="content">
        {loading && <div className="empty">載入中…</div>}
        {!loading && tripsQuery.isError && (
          <div className="empty">讀取行程清單失敗</div>
        )}

        {!loading && !tripsQuery.isError && visible.length === 0 && (
          <div className="empty">尚未有指派給你的行程,請聯絡管理者</div>
        )}

        {!loading &&
          SECTIONS.map(({ phase, label }) => {
            const list = groups.get(phase);
            if (!list || list.length === 0) return null;
            return (
              <div key={phase}>
                <div className="section-title">{label}</div>
                {list.map((t) => (
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
                      <div className="name">{t.name}</div>
                      <div className="meta">
                        {t.startDate} – {t.endDate} · {t.cities.join("、")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}
