import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeAppSettings } from "./utils/dateUtils";

// Immediately apply saved theme, font size, and density before mounting React to eliminate layout flashes
initializeAppSettings();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
