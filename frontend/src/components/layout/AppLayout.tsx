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
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { formatRoleDisplay } from "../../features/auth/types/auth.types";
import { useSettings } from "../../hooks/useSettings";

interface NavSubItem {
  label: string;
  path: string;
  icon?: LucideIcon;
  badge?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: readonly string[];
  badge?: string;
  disabled?: boolean;
  children?: NavSubItem[];
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
    label: "Administration",
    path: "/admin",
    icon: ShieldCheck,
    roles: ["admin", "hospitalmanager"],
    children: [
      {
        label: "Admin Dashboard",
        path: "/admin",
        icon: ShieldCheck,
      },
      {
        label: "Staff Approvals",
        path: "/admin/staff-approvals",
        icon: UserCheck,
      },
      {
        label: "User Management",
        path: "/admin/users",
        icon: UserCog,
      },
    ],
  },
  {
    label: "Prescriptions",
    path: "/prescriptions",
    icon: Pill,
    badge: "Soon",
    disabled: true,
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
    disabled: true,
    roles: ["admin", "hospitalmanager", "doctor", "labtechnician", "nurse"],
  },
  {
    label: "Billing",
    path: "/billing",
    icon: CreditCard,
    badge: "Soon",
    disabled: true,
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
  "/admin": "Admin Dashboard",
  "/admin/staff-approvals": "Staff Approvals",
  "/admin/users": "User Management",
  "/prescriptions": "Prescriptions",
  "/laboratory": "Laboratory",
  "/billing": "Billing",
  "/settings": "Settings",
};

function normalizeRole(
  role?: string | null,
  roleLevel?: number | string | null,
): string {
  const normalized = role?.trim().toLowerCase() ?? "";

  // Support common variations and numeric fallbacks in role names.
  const aliases: Record<string, string> = {
    "hospital manager": "hospitalmanager",
    hospital_manager: "hospitalmanager",
    "lab technician": "labtechnician",
    labtech: "labtechnician",
    lab_technician: "labtechnician",
    "100": "admin",
    "90": "hospitalmanager",
    "80": "doctor",
    "75": "pharmacist",
    "70": "labtechnician",
    "60": "nurse",
    "40": "receptionist",
    "20": "patient",
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  const cleaned = normalized.replace(/[\s_-]/g, "");
  if (cleaned && !/^\d+$/.test(cleaned)) {
    return cleaned;
  }

  const levelKey = String(roleLevel ?? "")
    .trim()
    .toLowerCase();
  return aliases[levelKey] ?? cleaned;
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
  const { theme, updateSetting } = useSettings();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const checkDark = () => {
      if (typeof document !== "undefined") {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    checkDark();
    window.addEventListener("careflow_settings_updated", checkDark);
    return () => {
      window.removeEventListener("careflow_settings_updated", checkDark);
    };
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    updateSetting("theme", nextTheme);
    setIsDark(!isDark);
  };

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

  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(() => {
    return location.pathname.startsWith("/admin");
  });

  // Keep dropdown open when navigating to any admin route
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      setIsAdminDropdownOpen(true);
    }
  }, [location.pathname]);

  // Never assume an unknown or missing role is Admin.
  const userRole = normalizeRole(user?.roleName, user?.role);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );

  const primaryNavItems = visibleNavItems.filter(
    (item) => item.path !== "/settings",
  );
  const bottomNavItems = visibleNavItems.filter(
    (item) => item.path === "/settings",
  );

  const pageTitle = getPageTitle(location.pathname);

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const handleLogout = () => {
    closeMobileNav();
    logout();
  };

  const renderNavItem = (item: NavItem, subnavId: string) => {
    const Icon = item.icon;

    if (item.children && item.children.length > 0) {
      const isAnyChildActive = item.children.some(
        (child) =>
          location.pathname === child.path ||
          location.pathname.startsWith(`${child.path}/`),
      );

      return (
        <div key={item.path} className="space-y-0.5">
          <button
            type="button"
            onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
            aria-expanded={isAdminDropdownOpen}
            aria-controls={subnavId}
            className={[
              "w-full h-10 flex items-center justify-between gap-3 rounded-lg",
              "px-3 py-2 text-sm font-medium transition-colors text-left",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-blue-400 focus-visible:ring-offset-2",
              "focus-visible:ring-offset-slate-900",
              isAnyChildActive
                ? "bg-slate-800/90 text-white font-semibold"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
            ].join(" ")}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon
                aria-hidden="true"
                className={`h-[18px] w-[18px] shrink-0 ${
                  isAnyChildActive ? "text-blue-400" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </span>

            <span className="flex items-center gap-1.5 shrink-0 text-slate-400">
              {item.badge && (
                <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                  {item.badge}
                </span>
              )}
              {isAdminDropdownOpen ? (
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 text-slate-400 transition-transform"
                />
              ) : (
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 text-slate-400 transition-transform"
                />
              )}
            </span>
          </button>

          {isAdminDropdownOpen && (
            <div
              id={subnavId}
              className="ml-5 pl-3 border-l border-slate-700/80 space-y-0.5 py-0.5 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {item.children.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive =
                  sub.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname === sub.path ||
                      location.pathname.startsWith(`${sub.path}/`);

                return (
                  <Link
                    key={sub.path}
                    to={sub.path}
                    onClick={closeMobileNav}
                    aria-current={isSubActive ? "page" : undefined}
                    className={[
                      "h-9 flex items-center justify-between gap-2.5 rounded-lg",
                      "px-3 py-1.5 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-blue-400 focus-visible:ring-offset-2",
                      "focus-visible:ring-offset-slate-900",
                      isSubActive
                        ? "bg-blue-600 text-white shadow-sm font-semibold"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {SubIcon && (
                        <SubIcon
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 ${
                            isSubActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                      )}
                      <span className="truncate">{sub.label}</span>
                    </span>

                    {sub.badge && (
                      <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                        {sub.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (item.disabled || item.badge === "Soon") {
      return (
        <div
          key={item.path}
          role="link"
          aria-disabled="true"
          title="Coming soon"
          className="h-10 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 opacity-60 cursor-not-allowed select-none"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Icon
              aria-hidden="true"
              className="h-[18px] w-[18px] shrink-0 text-slate-500"
            />
            <span className="truncate">{item.label}</span>
          </span>

          {item.badge && (
            <span className="shrink-0 rounded-md border border-slate-700/80 bg-slate-800/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {item.badge}
            </span>
          )}
        </div>
      );
    }

    const isExactMatch = location.pathname === item.path;
    const isChildMatch =
      item.path !== "/" &&
      location.pathname.startsWith(`${item.path}/`) &&
      !visibleNavItems.some(
        (other) =>
          other.path !== item.path &&
          other.path.startsWith(`${item.path}/`) &&
          (location.pathname === other.path ||
            location.pathname.startsWith(`${other.path}/`)),
      );
    const isActive = isExactMatch || isChildMatch;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobileNav}
        aria-current={isActive ? "page" : undefined}
        className={[
          "h-10 flex items-center justify-between gap-3 rounded-lg",
          "px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-blue-400 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-slate-900",
          isActive
            ? "bg-blue-600 text-white shadow-sm font-semibold"
            : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon
            aria-hidden="true"
            className={`h-[18px] w-[18px] shrink-0 ${
              isActive ? "text-white" : "text-slate-400"
            }`}
          />
          <span className="truncate">{item.label}</span>
        </span>

        {item.badge && (
          <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderNavigation = (mobile = false) => {
    const subnavId = mobile ? "admin-subnav-mobile" : "admin-subnav-desktop";

    return (
      <nav
        aria-label="Main navigation"
        className="cf-sidebar-scroll flex flex-1 flex-col justify-between overflow-y-auto px-3 py-2.5"
      >
        <div className="space-y-0.5">
          {primaryNavItems.map((item) => renderNavItem(item, subnavId))}

          {visibleNavItems.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-400">
              No navigation items are available for this account.
            </p>
          )}
        </div>

        {bottomNavItems.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-0.5">
            {bottomNavItems.map((item) => renderNavItem(item, subnavId))}
          </div>
        )}
      </nav>
    );
  };

  const renderUserFooter = () => (
    <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/50 px-4 py-3">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 text-xs font-bold text-blue-300"
      >
        {getInitials(user?.fullName)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-100">
          {user?.fullName || "Authenticated User"}
        </p>

        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck
            aria-hidden="true"
            className="h-3 w-3 shrink-0 text-emerald-400"
          />
          <span className="truncate">
            {formatRoleDisplay(user?.roleName, user?.role)}
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
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5">
          <div className="rounded-xl bg-blue-600 p-2 text-white">
            <Activity aria-hidden="true" className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight tracking-tight">
              CareFlow HMS
            </h1>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
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

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {user && (
              <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 sm:px-3">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-emerald-500"
                />
                <span>Signed in</span>
              </div>
            )}
          </div>
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
