import { useState, useEffect } from "react";

export function useSettings() {
  const getLatestSettings = () => ({
    timeFormat: localStorage.getItem("careflow_timeFormat") || "12",
    timeZone: localStorage.getItem("careflow_timeZone") || "Asia/Kolkata",
    theme: localStorage.getItem("careflow_theme") || "light",
    dateFormat: localStorage.getItem("careflow_dateFormat") || "DD/MM/YYYY",
    language: localStorage.getItem("careflow_language") || "en-US",
    fontSize: localStorage.getItem("careflow_fontSize") || "medium",
    density: localStorage.getItem("careflow_density") || "comfortable",
  });

  const [settings, setSettings] = useState(getLatestSettings);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getLatestSettings());
    };

    window.addEventListener("careflow_settings_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("careflow_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return settings;
}
