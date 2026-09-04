import { useEffect } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
  useParams
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTrips } from "../lib/content";
import { fetchMyAccess } from "../lib/members";
import { setSelectedTrip } from "../lib/trip";
import { useAuth } from "../lib/auth";

const tabs = [
  { to: "home", label: "首頁", ico: "🏠" },
  { to: "itinerary", label: "行程", ico: "🗓️" },
  { to: "flights", label: "機票", ico: "✈️" },
  { to: "hotels", label: "住宿", ico: "🏨" },
  { to: "transport", label: "交通", ico: "🚈" },
  { to: "guide", label: "攻略", ico: "📖" },
  { to: "phrases", label: "語言", ico: "🗣️" },
  { to: "mine", label: "我的", ico: "🙂" }
];

export default function TripLayout() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user, authEnabled } = useAuth();
  const { data: trips } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });
  const trip = trips?.find((t) => t.slug === slug);

  const accessQuery = useQuery({
    queryKey: ["my-access", user?.id],
    queryFn: fetchMyAccess,
    enabled: authEnabled
  });
  const access = accessQuery.data;
  const isAllowed =
    !authEnabled ||
    (access != null && (access.all || access.slugs.includes(slug)));

  useEffect(() => {
    if (slug && isAllowed) setSelectedTrip(slug);
  }, [slug, isAllowed]);

  // 已啟用帳號:等權限回來再決定
  if (authEnabled && !accessQuery.isSuccess) {
    return <div className="empty">載入中…</div>;
  }
  // 沒有這個行程的權限 → 踢回選擇行程
  if (authEnabled && !isAllowed) {
    return <Navigate to="/pick" replace />;
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <h1>{trip?.name ?? slug}</h1>
          <div className="sub">
            {trip
              ? `${trip.startDate} – ${trip.endDate} · ${trip.cities.join("、")}`
              : ""}
          </div>
        </div>
        <button className="btn" onClick={() => navigate("/pick")}>
          切換行程
        </button>
      </div>

      <div className="content">
        <Outlet context={{ slug, trip }} />
      </div>

      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={`/t/${slug}/${t.to}`}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="ico">{t.ico}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
