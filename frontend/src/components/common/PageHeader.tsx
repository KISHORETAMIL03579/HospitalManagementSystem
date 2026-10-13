import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: LucideIcon | ReactNode;
  iconBgColor?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
  variant?: "default" | "banner";
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconBgColor,
  actions,
  badge,
  className = "",
  variant = "default",
}) => {
  const renderIcon = () => {
    if (!Icon) return null;
    const isComponent =
      typeof Icon === "function" ||
      (typeof Icon === "object" &&
        Icon !== null &&
        "$$typeof" in (Icon as any));

    if (iconBgColor) {
      return (
        <div className={`p-2 rounded-xl shrink-0 ${iconBgColor}`}>
          {isComponent
            ? React.createElement(Icon as any, { className: "w-6 h-6" })
            : Icon}
        </div>
      );
    }

    return (
      <span className="shrink-0 text-blue-600 dark:text-blue-400">
        {isComponent
          ? React.createElement(Icon as any, { className: "w-7 h-7" })
          : Icon}
      </span>
    );
  };

  if (variant === "banner") {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
      >
        <div>
          <div className="flex items-center gap-3">
            {renderIcon()}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {title}
                </h1>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          {renderIcon()}
          <span>{title}</span>
          {badge}
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
