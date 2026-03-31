import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTrafficTracker } from "./lib/trafficTracker";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const insertPreconnect = (href: string) => {
  const existing = document.querySelector(`link[rel="preconnect"][href="${href}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = href;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);

  const dnsPrefetch = document.createElement("link");
  dnsPrefetch.rel = "dns-prefetch";
  dnsPrefetch.href = href;
  document.head.appendChild(dnsPrefetch);
};

// Defer non-critical tracking to avoid slowing initial render.
if (typeof window !== "undefined") {
  // Preconnect to Supabase early to reduce auth/data latency without changing app flow.
  if (isSupabaseConfigured && import.meta.env.VITE_SUPABASE_URL) {
    try {
      const supabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL).origin;
      insertPreconnect(supabaseHost);
    } catch (e) {
      // Swallow errors; preconnect is a best-effort hint.
      console.warn("Supabase preconnect skipped", e);
    }
  }

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
