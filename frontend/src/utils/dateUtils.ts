export function formatTimeSlot(timeStr?: string, formatPref?: string): string {
  if (!timeStr) return "";

  const timeFormat =
    formatPref || localStorage.getItem("careflow_timeFormat") || "12";

  let hours = 0;
  let minutes = 0;

  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    hours = d.getHours();
    minutes = d.getMinutes();
  } else {
    const parts = timeStr.split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  }

  const mm = minutes.toString().padStart(2, "0");

  if (timeFormat === "24" || timeFormat === "Hour24") {
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
): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const pattern =
    formatPref || localStorage.getItem("careflow_dateFormat") || "DD/MM/YYYY";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString();

  if (pattern === "MM/DD/YYYY") {
    return `${month}/${day}/${year}`;
  } else if (pattern === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  } else {
    return `${day}/${month}/${year}`;
  }
}

export function formatLiveTime(dateVal: Date, timeFormatPref?: string): string {
  const timeFormat =
    timeFormatPref || localStorage.getItem("careflow_timeFormat") || "12";
  const is24 = timeFormat === "24" || timeFormat === "Hour24";
  return dateVal.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !is24,
  });
}

export function notifySettingsChanged() {
  window.dispatchEvent(new Event("careflow_settings_updated"));
}

export function applyThemeMode(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
  notifySettingsChanged();
}

export function applyFontSize(size: "small" | "medium" | "large") {
  const root = document.documentElement;
  if (size === "small") {
    root.style.fontSize = "13px";
  } else if (size === "large") {
    root.style.fontSize = "16px";
  } else {
    root.style.fontSize = "14px";
  }
  notifySettingsChanged();
}

export function applyDensityMode(density: "compact" | "comfortable") {
  const root = document.documentElement;
  if (density === "compact") {
    root.classList.add("compact-mode");
  } else {
    root.classList.remove("compact-mode");
  }
  notifySettingsChanged();
}
