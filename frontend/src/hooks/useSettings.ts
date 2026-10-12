import { useState, useEffect, useCallback } from "react";
import { updateStoredSettings, StoredPreferences } from "../utils/dateUtils";

export interface AppSettings {
  timeFormat: "12" | "24";
  timeZone: string;
  theme: "light" | "dark" | "system";
  dateFormat: string;
  language: string;
  fontSize: "small" | "medium" | "large";
  density: "compact" | "comfortable";
}

const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "12",
  timeZone: "Asia/Kolkata",
  theme: "light",
  dateFormat: "DD/MM/YYYY",
  language: "en-US",
  fontSize: "medium",
  density: "comfortable",
};

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function readStorageValue(key: string, fallback: string): string {
  if (!isBrowser) return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function getLatestSettings(): AppSettings {
  return {
    timeFormat: readStorageValue(
      "careflow_timeFormat",
      DEFAULT_SETTINGS.timeFormat,
    ) as "12" | "24",
    timeZone: readStorageValue("careflow_timeZone", DEFAULT_SETTINGS.timeZone),
    theme: readStorageValue("careflow_theme", DEFAULT_SETTINGS.theme) as
      "light" | "dark" | "system",
    dateFormat: readStorageValue(
      "careflow_dateFormat",
      DEFAULT_SETTINGS.dateFormat,
    ),
    language: readStorageValue("careflow_language", DEFAULT_SETTINGS.language),
    fontSize: readStorageValue(
      "careflow_fontSize",
      DEFAULT_SETTINGS.fontSize,
    ) as "small" | "medium" | "large",
    density: readStorageValue("careflow_density", DEFAULT_SETTINGS.density) as
      "compact" | "comfortable",
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getLatestSettings);

  useEffect(() => {
    if (!isBrowser) return;

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

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      updateStoredSettings({ [key]: value });

      // Immediately synchronize local component state
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    updateStoredSettings(newSettings as StoredPreferences);

    // Immediately synchronize local component state
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  return {
    ...settings,
    settings,
    updateSetting,
    updateSettings,
  };
}
