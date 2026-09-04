import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import TripPicker from "./pages/TripPicker";
import TripLayout from "./pages/TripLayout";
import Home from "./pages/Home";
import Itinerary from "./pages/Itinerary";
import Flights from "./pages/Flights";
import Hotels from "./pages/Hotels";
import Transport from "./pages/Transport";
import Guide from "./pages/Guide";
import Phrases from "./pages/Phrases";
import { getSelectedTrip } from "./lib/trip";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }
});

// HashRouter:GitHub Pages 靜態站不需伺服器 rewrite,重新整理不會 404
const router = createHashRouter([
  {
    path: "/",
    element: (() => {
      const slug = getSelectedTrip();
      return slug ? <Navigate to={`/t/${slug}/home`} replace /> : <TripPicker />;
    })()
  },
  { path: "/pick", element: <TripPicker /> },
  {
    path: "/t/:slug",
    element: <TripLayout />,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: "home", element: <Home /> },
      { path: "itinerary", element: <Itinerary /> },
      { path: "flights", element: <Flights /> },
      { path: "hotels", element: <Hotels /> },
      { path: "transport", element: <Transport /> },
      { path: "guide", element: <Guide /> },
      { path: "phrases", element: <Phrases /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
