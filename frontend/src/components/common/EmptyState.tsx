import React, { ReactNode } from "react";
import { LucideIcon, FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className = "",
}) => {
  const renderIcon = () => {
    if (!Icon) return null;
    const isComponent =
      typeof Icon === "function" ||
      (typeof Icon === "object" &&
        Icon !== null &&
        "$$typeof" in (Icon as any));

    return (
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        {isComponent
          ? React.createElement(Icon as any, { className: "w-6 h-6" })
          : Icon}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {renderIcon()}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
