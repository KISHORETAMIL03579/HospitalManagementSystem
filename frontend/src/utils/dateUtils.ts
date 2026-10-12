const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function getStoredPreference(key: string, fallback: string): string {
  if (!isBrowser) return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function formatTimeSlot(
  timeStr?: string,
  formatPref?: string,
  timeZonePref?: string,
): string {
  if (!timeStr) return "";

  const timeFormat =
    formatPref || getStoredPreference("careflow_timeFormat", "12");
  const timeZone =
    timeZonePref || getStoredPreference("careflow_timeZone", "Asia/Kolkata");
  const is24 = timeFormat === "24" || timeFormat === "Hour24";

  // If timeStr is an ISO date-time string (e.g. 2026-10-12T14:30:00Z)
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone,
          hour: is24 ? "2-digit" : "2-digit",
          minute: "2-digit",
          hour12: !is24,
        });
        return formatter.format(d);
      } catch {
        // Fallback to local Date methods if timeZone string is unrecognized
        const hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        if (is24) {
          return `${hours.toString().padStart(2, "0")}:${minutes}`;
        }
        const period = hours >= 12 ? "PM" : "AM";
        const h12 = hours % 12 || 12;
        return `${h12.toString().padStart(2, "0")}:${minutes} ${period}`;
      }
    }
  }

  // Plain slot string like "14:30" or "09:00:00"
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const mm = minutes.toString().padStart(2, "0");

  if (is24) {
    const hh = hours.toString().padStart(2, "0");
    return `${hh}:${mm}`;
  } else {
    const period = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    const hh = h12.toString().padStart(2, "0");
    return `${hh}:${mm} ${period}`;
  }
}

export function formatDateByPattern(
  dateVal: string | Date,
  formatPref?: string,
  timeZonePref?: string,
): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const pattern =
    formatPref || getStoredPreference("careflow_dateFormat", "DD/MM/YYYY");
  const timeZone =
    timeZonePref || getStoredPreference("careflow_timeZone", "Asia/Kolkata");

  let year = "";
  let monthNum = "";
  let day = "";
  let hourStr = "";
  let minuteStr = "";
  let monthShort = "";

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);

    for (const p of parts) {
      if (p.type === "year") year = p.value;
      else if (p.type === "month") monthNum = p.value;
      else if (p.type === "day") day = p.value;
      else if (p.type === "hour") hourStr = p.value;
      else if (p.type === "minute") minuteStr = p.value;
    }

    monthShort = new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
    }).format(d);
  } catch {
    // Fallback if target timeZone is unrecognized or unsupported
    const monthsShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    year = d.getFullYear().toString();
    monthNum = (d.getMonth() + 1).toString().padStart(2, "0");
    day = d.getDate().toString().padStart(2, "0");
    hourStr = d.getHours().toString().padStart(2, "0");
    minuteStr = d.getMinutes().toString().padStart(2, "0");
    monthShort = monthsShort[d.getMonth()];
  }

  if (pattern === "hh:mm a" || pattern === "HH:mm" || pattern === "hh:mm") {
    const hNum = parseInt(hourStr, 10) || 0;
    if (pattern === "HH:mm") {
      return `${hourStr.padStart(2, "0")}:${minuteStr.padStart(2, "0")}`;
    }
    const period = hNum >= 12 ? "PM" : "AM";
    const h12 = hNum % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${minuteStr.padStart(2, "0")} ${period}`;
  }

  if (pattern === "MMM dd, yyyy") {
    return `${monthShort} ${day}, ${year}`;
  } else if (pattern === "MM/DD/YYYY") {
    return `${monthNum}/${day}/${year}`;
  } else if (pattern === "YYYY-MM-DD") {
    return `${year}-${monthNum}-${day}`;
  } else {
    return `${day}/${monthNum}/${year}`;
  }
}

export function formatLiveTime(
  dateVal: Date,
  timeFormatPref?: string,
  timeZonePref?: string,
): string {
  const timeFormat =
    timeFormatPref || getStoredPreference("careflow_timeFormat", "12");
  const timeZone =
    timeZonePref || getStoredPreference("careflow_timeZone", "Asia/Kolkata");
  const is24 = timeFormat === "24" || timeFormat === "Hour24";

  try {
    return dateVal.toLocaleTimeString([], {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !is24,
    });
  } catch {
    return dateVal.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !is24,
    });
  }
}

export function notifySettingsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("careflow_settings_updated"));
  }
}

export function applyThemeMode(theme: "light" | "dark" | "system"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

export function applyFontSize(size: "small" | "medium" | "large"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (size === "small") {
    root.style.fontSize = "13px";
  } else if (size === "large") {
    root.style.fontSize = "16px";
  } else {
    root.style.fontSize = "14px";
  }
}

export function applyDensityMode(density: "compact" | "comfortable"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (density === "compact") {
    root.classList.add("compact-mode");
  } else {
    root.classList.remove("compact-mode");
  }
}

export function updateTheme(theme: "light" | "dark" | "system"): void {
  if (isBrowser) {
    try {
      localStorage.setItem("careflow_theme", theme);
    } catch (e) {
      console.error("Failed to persist careflow_theme:", e);
    }
  }
  applyThemeMode(theme);
  notifySettingsChanged();
}

export function updateFontSize(size: "small" | "medium" | "large"): void {
  if (isBrowser) {
    try {
      localStorage.setItem("careflow_fontSize", size);
    } catch (e) {
      console.error("Failed to persist careflow_fontSize:", e);
    }
  }
  applyFontSize(size);
  notifySettingsChanged();
}

export function updateDensityMode(density: "compact" | "comfortable"): void {
  if (isBrowser) {
    try {
      localStorage.setItem("careflow_density", density);
    } catch (e) {
      console.error("Failed to persist careflow_density:", e);
    }
  }
  applyDensityMode(density);
  notifySettingsChanged();
}

export interface StoredPreferences {
  theme?: "light" | "dark" | "system";
  fontSize?: "small" | "medium" | "large";
  density?: "compact" | "comfortable";
  timeFormat?: "12" | "24";
  timeZone?: string;
  dateFormat?: string;
  language?: string;
  firstDay?: "monday" | "sunday";
}

export function updateStoredSettings(settings: StoredPreferences): void {
  if (isBrowser) {
    Object.entries(settings).forEach(([key, val]) => {
      if (val !== undefined) {
        try {
          localStorage.setItem(`careflow_${key}`, String(val));
        } catch (e) {
          console.error(`Failed to persist careflow_${key}:`, e);
        }
      }
    });
  }

  if (settings.theme) applyThemeMode(settings.theme);
  if (settings.fontSize) applyFontSize(settings.fontSize);
  if (settings.density) applyDensityMode(settings.density);

  notifySettingsChanged();
}

export function initializeAppSettings(): void {
  if (!isBrowser || typeof document === "undefined") return;

  try {
    const savedTheme =
      (localStorage.getItem("careflow_theme") as "light" | "dark" | "system") ||
      "light";
    const savedFontSize =
      (localStorage.getItem("careflow_fontSize") as
        "small" | "medium" | "large") || "medium";
    const savedDensity =
      (localStorage.getItem("careflow_density") as "compact" | "comfortable") ||
      "comfortable";

    applyThemeMode(savedTheme);
    applyFontSize(savedFontSize);
    applyDensityMode(savedDensity);
  } catch (err) {
    console.error(
      "Failed to initialize CareFlow app settings on startup:",
      err,
    );
  }
}
