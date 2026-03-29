import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTrafficTracker } from "./lib/trafficTracker";

// Defer non-critical tracking to avoid slowing initial render.
if (typeof window !== "undefined") {
  const run = () => initTrafficTracker();
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number }).requestIdleCallback(run);
  } else {
    setTimeout(run, 800);
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
