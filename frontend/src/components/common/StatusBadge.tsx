import React from "react";
import {
  Clock,
  Clock3,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  MailCheck,
  Send,
  RefreshCw,
} from "lucide-react";
import { AppointmentStatus } from "../../features/appointments/types/appointment.types";

export type BadgeVariant =
  "appointment" | "staffApproval" | "email" | "active" | "custom";

export interface StatusBadgeProps {
  type?: BadgeVariant;
  status?: AppointmentStatus | string | number | boolean;
  label?: string;
  variantColor?:
    "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  title?: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = "custom",
  status,
  label,
  variantColor,
  title,
  size = "md",
  className = "",
}) => {
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";

  // 1. Appointment Status Badge
  if (type === "appointment" && status !== undefined && status !== null) {
    const s = String(status);
    let val = 10;
    if (typeof status === "number") {
      val = status;
    } else if (s === "0" || s === "Pending") {
      val = 0;
    } else if (
      s === "10" ||
      s === "1" ||
      s === "Confirmed" ||
      s === "Scheduled"
    ) {
      val = 10;
    } else if (s === "20" || s === "2" || s === "CheckedIn") {
      val = 20;
    } else if (s === "30" || s === "3" || s === "InConsultation") {
      val = 30;
    } else if (s === "40" || s === "4" || s === "Completed") {
      val = 40;
    } else if (s === "50" || s === "5" || s === "Cancelled") {
      val = 50;
    } else if (s === "60" || s === "6" || s === "NoShow") {
      val = 60;
    }

    switch (val) {
      case AppointmentStatus.Pending:
      case 0:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses} ${className}`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case AppointmentStatus.Confirmed:
      case 10:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses} ${className}`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case AppointmentStatus.CheckedIn:
      case 20:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses} ${className}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Checked In</span>
          </span>
        );
      case AppointmentStatus.InConsultation:
      case 30:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses} ${className}`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>In Consultation</span>
          </span>
        );
      case AppointmentStatus.Completed:
      case 40:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case AppointmentStatus.Cancelled:
      case 50:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses} ${className}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      case AppointmentStatus.NoShow:
      case 60:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>No Show</span>
          </span>
        );
      default:
        return (
          <span
            title={title}
            className={`inline-flex items-center rounded-full font-semibold bg-slate-50 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
          >
            <span>{String(status)}</span>
          </span>
        );
    }
  }

  // 2. Staff Registration Request Status Badge
  if (type === "staffApproval" && status !== undefined && status !== null) {
    const s = String(status).toLowerCase();
    if (s === "pending" || s === "0") {
      return (
        <span
          title={title}
          className={`inline-flex items-center rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses} ${className}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending</span>
        </span>
      );
    }
    if (s === "approved" || s === "1") {
      return (
        <span
          title={title}
          className={`inline-flex items-center rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    }
    if (s === "rejected" || s === "2") {
      return (
        <span
          title={title}
          className={`inline-flex items-center rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses} ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    }
  }

  // 3. Email Delivery Status Badge
  if (type === "email" && status !== undefined && status !== null) {
    const s = String(status).toLowerCase();
    if (status === 1 || s === "sent" || s === "delivered") {
      return (
        <span
          title={title}
          className={`inline-flex items-center rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
        >
          <MailCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SENT</span>
        </span>
      );
    }
    if (status === 0 || s === "queued") {
      return (
        <span
          title={title}
          className={`inline-flex items-center rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses} ${className}`}
        >
          <Send className="w-3.5 h-3.5 text-blue-500" />
          <span>QUEUED</span>
        </span>
      );
    }
    if (status === 3 || s === "failed" || s === "bounced") {
      return (
        <span
          title={title || "Email delivery failed"}
          className={`inline-flex items-center rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-help ${sizeClasses} ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>FAILED</span>
        </span>
      );
    }
    if (status === 5 || s === "retrying") {
      return (
        <span
          title={title}
          className={`inline-flex items-center rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses} ${className}`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
          <span>RETRYING</span>
        </span>
      );
    }
  }

  // 4. Active / Inactive Status Badge
  if (type === "active") {
    const isActive =
      status === true ||
      status === 1 ||
      String(status).toLowerCase() === "true" ||
      String(status).toLowerCase() === "active";

    return (
      <span
        title={title}
        className={`inline-flex items-center rounded-full font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        } ${sizeClasses} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
        <span>{label || (isActive ? "Active" : "Inactive")}</span>
      </span>
    );
  }

  // 5. Generic Custom Badge
  const colorMap = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const selectedColor = colorMap[variantColor || "neutral"];

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full font-semibold border ${selectedColor} ${sizeClasses} ${className}`}
    >
      <span>{label || String(status)}</span>
    </span>
  );
};
