import React from "react";
import ReactDOM from "react-dom/client";
import {
  createHashRouter,
  RouterProvider,
  Navigate,
  useLocation
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import TripPicker from "./pages/TripPicker";
import TripLayout from "./pages/TripLayout";
import Home from "./pages/Home";
import Itinerary from "./pages/Itinerary";
import Flights from "./pages/Flights";
import Hotels from "./pages/Hotels";
import Transport from "./pages/Transport";
import Guide from "./pages/Guide";
import Phrases from "./pages/Phrases";
import Mine from "./pages/Mine";
import { getSelectedTrip } from "./lib/trip";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, session, authEnabled } = useAuth();
  const location = useLocation();
  if (!authEnabled) return <>{children}</>;
  if (!ready) return <div className="empty">載入中…</div>;
  if (!session)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.hash }}
      />
    );
  return <>{children}</>;
}

function RootRedirect() {
  const slug = getSelectedTrip();
  return slug ? (
    <Navigate to={`/t/${slug}/home`} replace />
  ) : (
    <Navigate to="/pick" replace />
  );
}

const router = createHashRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <RootRedirect />
      </RequireAuth>
    )
  },
  {
    path: "/pick",
    element: (
      <RequireAuth>
        <TripPicker />
      </RequireAuth>
    )
  },
  {
    path: "/t/:slug",
    element: (
      <RequireAuth>
        <TripLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: "home", element: <Home /> },
      { path: "itinerary", element: <Itinerary /> },
      { path: "flights", element: <Flights /> },
      { path: "hotels", element: <Hotels /> },
      { path: "transport", element: <Transport /> },
      { path: "guide", element: <Guide /> },
      { path: "phrases", element: <Phrases /> },
      { path: "mine", element: <Mine /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
