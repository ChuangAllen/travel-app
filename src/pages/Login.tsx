import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { signIn, session, authEnabled } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // 未啟用帳號功能 → 不需登入;已登入 → 一律先進「選擇行程」
  if (!authEnabled || session) {
    return <Navigate to="/pick" replace />;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await signIn(code, password);
    setBusy(false);
    if (error) {
      setErr(
        error === "Invalid login credentials" ? "代號或密碼錯誤" : error
      );
      return;
    }
    navigate("/pick", { replace: true }); // 首次登入先到選擇行程
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <h1>登入</h1>
          <div className="sub">Travel APP</div>
        </div>
      </div>
      <div className="content">
        <form className="card" onSubmit={submit}>
          <label className="field-label">使用者代號</label>
          <input
            className="field"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例:demo"
            required
          />
          <label className="field-label" style={{ marginTop: 12 }}>
            密碼
          </label>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && (
            <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>
              {err}
            </div>
          )}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16, padding: "10px 0" }}
            disabled={busy}
          >
            {busy ? "登入中…" : "登入"}
          </button>
          <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            帳號由管理者建立;登入後同一裝置一個月內免再登入。
          </div>
        </form>
      </div>
    </div>
  );
}
