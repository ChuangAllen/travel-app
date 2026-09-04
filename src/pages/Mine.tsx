import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { emailToCode } from "../lib/config";

const ROWS: { icon: string; label: string; to?: string; soon?: boolean }[] = [
  { icon: "👤", label: "個人資料", soon: true },
  { icon: "🧾", label: "我的費用", soon: true },
  { icon: "🎟️", label: "我的票券", soon: true },
  { icon: "🧳", label: "攜帶物品", soon: true },
  { icon: "📖", label: "旅遊攻略", to: "guide" },
  { icon: "⚙️", label: "設定", soon: true }
];

export default function Mine() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user, authEnabled, signOut } = useAuth();

  return (
    <>
      <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "var(--green-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flex: "none"
          }}
        >
          🙂
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, wordBreak: "break-all" }}>
            {emailToCode(user?.email) || "訪客"}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {authEnabled ? (user ? "已登入" : "未登入") : "未啟用帳號功能"}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "4px 0" }}>
        {ROWS.map((r) => (
          <div
            key={r.label}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (r.to) navigate(`/t/${slug}/${r.to}`);
              else alert(`「${r.label}」規劃中`);
            }}
            onKeyDown={(e) => e.key === "Enter" && r.to && navigate(`/t/${slug}/${r.to}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid var(--sand)",
              cursor: "pointer"
            }}
          >
            <span style={{ fontSize: 18 }}>{r.icon}</span>
            <span style={{ flex: 1 }}>{r.label}</span>
            {r.soon && (
              <span className="muted" style={{ fontSize: 11 }}>
                規劃中
              </span>
            )}
            <span className="muted">›</span>
          </div>
        ))}
      </div>

      {authEnabled && user && (
        <button
          className="btn"
          style={{ width: "100%", marginTop: 8, padding: "10px 0" }}
          onClick={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
        >
          登出
        </button>
      )}
    </>
  );
}
