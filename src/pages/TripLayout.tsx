import { useEffect } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useParams
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTrips } from "../lib/content";
import { setSelectedTrip } from "../lib/trip";

const tabs = [
  { to: "home", label: "首頁", ico: "🏠" },
  { to: "itinerary", label: "行程", ico: "🗓️" },
  { to: "flights", label: "機票", ico: "✈️" },
  { to: "hotels", label: "住宿", ico: "🏨" },
  { to: "transport", label: "交通", ico: "🚈" },
  { to: "guide", label: "攻略", ico: "📖" },
  { to: "phrases", label: "語言", ico: "🗣️" }
];

export default function TripLayout() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data: trips } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });
  const trip = trips?.find((t) => t.slug === slug);

  useEffect(() => {
    if (slug) setSelectedTrip(slug);
  }, [slug]);

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
