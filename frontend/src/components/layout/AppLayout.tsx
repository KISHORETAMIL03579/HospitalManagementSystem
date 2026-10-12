import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  TestTube,
  UserCog,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../features/auth/hooks/useAuth";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: readonly string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Patients",
    path: "/patients",
    icon: Users,
    roles: ["admin", "hospitalmanager", "doctor", "nurse", "receptionist"],
  },
  {
    label: "Appointments",
    path: "/appointments",
    icon: Calendar,
    roles: [
      "admin",
      "hospitalmanager",
      "doctor",
      "nurse",
      "receptionist",
      "patient",
    ],
  },
  {
    label: "Doctors",
    path: "/doctors",
    icon: Stethoscope,
    roles: ["admin", "hospitalmanager", "doctor", "nurse", "receptionist"],
  },
  {
    label: "Admin Dashboard",
    path: "/admin",
    icon: ShieldCheck,
    roles: ["admin", "hospitalmanager"],
  },
  {
    label: "User Management",
    path: "/admin/users",
    icon: UserCog,
    roles: ["admin", "hospitalmanager"],
  },
  {
    label: "Staff Approvals",
    path: "/admin/staff-approvals",
    icon: UserCheck,
    roles: ["admin", "hospitalmanager"],
  },
  {
    label: "Prescriptions",
    path: "/prescriptions",
    icon: Pill,
    badge: "Soon",
    roles: [
      "admin",
      "hospitalmanager",
      "doctor",
      "nurse",
      "pharmacist",
      "patient",
    ],
  },
  {
    label: "Laboratory",
    path: "/laboratory",
    icon: TestTube,
    badge: "Soon",
    roles: ["admin", "hospitalmanager", "doctor", "labtechnician", "nurse"],
  },
  {
    label: "Billing",
    path: "/billing",
    icon: CreditCard,
    badge: "Soon",
    roles: ["admin", "hospitalmanager", "receptionist"],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/appointments": "Appointments",
  "/doctors": "Doctors",
  "/admin/users": "User Management",
  "/prescriptions": "Prescriptions",
  "/laboratory": "Laboratory",
  "/billing": "Billing",
  "/settings": "Settings",
};

function normalizeRole(role?: string | null): string {
  const normalized = role?.trim().toLowerCase() ?? "";

  // Support common variations in role names.
  const aliases: Record<string, string> = {
    "hospital manager": "hospitalmanager",
    hospital_manager: "hospitalmanager",
    "lab technician": "labtechnician",
    labtech: "labtechnician",
    lab_technician: "labtechnician",
  };

  return aliases[normalized] ?? normalized.replace(/[\s_-]/g, "");
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "US";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getPageTitle(pathname: string): string {
  // Prefer an exact route label.
  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname];
  }

  // Use the nearest matching parent route for nested pages.
  const matchingRoute = NAV_ITEMS.filter((item) => item.path !== "/")
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    );

  if (matchingRoute) {
    return matchingRoute.label;
  }

  // Fallback for routes without a configured label.
  const segment = pathname.split("/").filter(Boolean).pop();

  if (!segment) return "Dashboard";

  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  // Never assume an unknown or missing role is Admin.
  const userRole = normalizeRole(user?.roleName);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );

  const pageTitle = getPageTitle(location.pathname);

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const handleLogout = () => {
    closeMobileNav();
    logout();
  };

  const renderNavigation = (_mobile = false) => (
    <nav
      aria-label="Main navigation"
      className="flex-1 space-y-1 overflow-y-auto p-3"
    >
      {visibleNavItems.map((item) => {
        const Icon = item.icon;

        const isActive =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={closeMobileNav}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex items-center justify-between gap-3 rounded-lg",
              "px-3.5 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-blue-400 focus-visible:ring-offset-2",
              "focus-visible:ring-offset-slate-900",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white",
            ].join(" ")}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </span>

            {item.badge && (
              <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {visibleNavItems.length === 0 && (
        <p className="px-3 py-4 text-sm text-slate-400">
          No navigation items are available for this account.
        </p>
      )}
    </nav>
  );

  const renderUserFooter = () => (
    <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/50 p-4">
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 text-xs font-bold text-blue-300"
      >
        {getInitials(user?.fullName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-100">
          {user?.fullName || "Authenticated User"}
        </p>

        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck
            aria-hidden="true"
            className="h-3 w-3 shrink-0 text-emerald-400"
          />
          <span className="truncate">
            {user?.roleName || "Role unavailable"}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Sign out"
        title="Sign out"
        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white md:flex">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <div className="rounded-xl bg-blue-600 p-2 text-white">
            <Activity aria-hidden="true" className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight tracking-tight">
              CareFlow HMS
            </h1>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Hospital System
            </p>
          </div>
        </div>

        {renderNavigation()}
        {renderUserFooter()}
      </aside>

      {/* Mobile navigation overlay */}
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
          onClick={closeMobileNav}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        id="mobile-navigation"
        aria-label="Mobile sidebar"
        aria-hidden={!isMobileNavOpen}
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw]",
          "flex-col bg-slate-900 text-white shadow-xl",
          "transition-transform duration-200 md:hidden",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2">
              <Activity aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">CareFlow HMS</h2>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                Hospital System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobileNav}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {renderNavigation(true)}
        {renderUserFooter()}
      </aside>

      {/* Main application area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-controls="mobile-navigation"
              aria-expanded={isMobileNavOpen}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div
                aria-label={`Breadcrumb: CareFlow HMS, ${pageTitle}`}
                className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm"
              >
                <span className="hidden font-semibold text-slate-700 dark:text-slate-200 sm:inline">
                  CareFlow HMS
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  /
                </span>
                <span className="truncate">{pageTitle}</span>
              </div>

              <h2 className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                {pageTitle}
              </h2>
            </div>
          </div>

          {user && (
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 sm:px-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-emerald-500"
              />
              <span>Signed in</span>
            </div>
          )}
        </header>

        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
