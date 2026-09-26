import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import App from "./App";
import "./index.css";

// Hash-based routing makes the app host-agnostic (Vercel, Netlify,
// GitHub Pages, static hosting) — no server rewrite rules required.
createRoot(document.getElementById("root")!).render(
  <Router hook={useHashLocation}>
    <App />
  </Router>
);
