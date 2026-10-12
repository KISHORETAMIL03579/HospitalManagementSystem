import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CalendarX,
} from "lucide-react";

interface DoctorAvailabilityBadgeProps {
  status: string;
  nextSlotText?: string;
  size?: "sm" | "md" | "lg";
}

export const DoctorAvailabilityBadge: React.FC<
  DoctorAvailabilityBadgeProps
> = ({ status, nextSlotText, size = "md" }) => {
  const normalized = (status || "").toLowerCase();

  let badgeColor =
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let dotColor = "bg-slate-400";
  let pulse = false;
  let label = status || "Unavailable";
  let Icon = Clock;

  if (normalized.includes("available now")) {
    badgeColor =
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    dotColor = "bg-emerald-500";
    pulse = true;
    label = "Available now";
    Icon = CheckCircle2;
  } else if (normalized.includes("available today")) {
    badgeColor =
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
    dotColor = "bg-sky-500";
    label = "Available today";
    Icon = Clock;
  } else if (
    normalized.includes("available later") ||
    normalized.includes("tomorrow")
  ) {
    badgeColor =
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800";
    dotColor = "bg-indigo-500";
    label = "Available later";
    Icon = Clock;
  } else if (normalized.includes("fully booked")) {
    badgeColor =
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    dotColor = "bg-amber-500";
    label = "Fully booked";
    Icon = AlertTriangle;
  } else if (normalized.includes("on leave") || normalized.includes("leave")) {
    badgeColor =
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    dotColor = "bg-rose-500";
    label = "On leave";
    Icon = CalendarX;
  } else if (normalized.includes("inactive")) {
    badgeColor =
      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    dotColor = "bg-slate-400";
    label = "Inactive";
    Icon = XCircle;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
    lg: "px-3 py-1.5 text-sm gap-2 font-medium",
  }[size];

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${badgeColor} ${sizeClasses}`}
      >
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}
          />
        </span>
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </span>
      {nextSlotText && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1">
          {nextSlotText}
        </span>
      )}
    </div>
  );
};
