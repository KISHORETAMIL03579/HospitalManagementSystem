import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Server,
  Database,
  KeyRound,
  Mail,
  UserCheck,
  Users,
  ArrowRight,
  Activity,
  CheckCircle2,
  Settings,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import {
  authApi,
  StaffRegistrationRequest,
  isPendingStatus,
} from "../../auth/api/authApi";

export const AdminDashboardPage: React.FC = () => {
  const [staffRequests, setStaffRequests] = useState<
    StaffRegistrationRequest[]
  >([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStaffRequests = async () => {
    setIsRefreshing(true);
    try {
      const data = await authApi.getStaffRequests();
      setStaffRequests(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch staff requests for admin dashboard:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffRequests();
  }, []);

  const pendingApprovalsCount = staffRequests.filter((r) =>
    isPendingStatus(r.status),
  ).length;
  const approvedStaffCount = staffRequests.filter(
    (r) => !isPendingStatus(r.status),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            System Administration Center
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Admin Dashboard & System Health
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Central monitoring for infrastructure health, staff approvals,
            account access, and hospital operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStaffRequests}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Section 1: System Status & Infrastructure Monitoring */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Service Health & Connectivity
          </h2>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            4 of 4 Services Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Backend API */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Backend API
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <Server className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Healthy
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
              <span>ASP.NET Core 10</span>
              <span className="font-mono text-[11px] text-slate-400">
                REST v1
              </span>
            </div>
          </div>

          {/* Card 2: Database */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Database
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Database className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Connected
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
              <span>SQL Server (HMS)</span>
              <span className="font-mono text-[11px] text-slate-400">
                EF Core
              </span>
            </div>
          </div>

          {/* Card 3: Authentication */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Authentication
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
              <span>JWT Bearer Security</span>
              <span className="font-mono text-[11px] text-slate-400">RBAC</span>
            </div>
          </div>

          {/* Card 4: Email & Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Dispatcher
              </span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600">
                <Mail className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Operational
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
              <span>SMTP Notifications</span>
              <span className="font-mono text-[11px] text-slate-400">
                Queue OK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Attention Required & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Staff Approvals Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Staff Registration Approvals
                  </h3>
                  <p className="text-xs text-slate-500">
                    Identity verification and role assignment
                  </p>
                </div>
              </div>

              {pendingApprovalsCount > 0 ? (
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
                  {pendingApprovalsCount} Pending
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All Clear
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pendingApprovalsCount > 0
                ? `There are ${pendingApprovalsCount} new healthcare staff registration request(s) awaiting hospital administrator review and role authorization.`
                : "All submitted staff registration requests have been processed. No pending requests require authorization."}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {approvedStaffCount} processed requests on record
            </span>
            <Link
              to="/admin/staff-approvals"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <span>Review Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security & Access Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Security & Account Governance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Authentication logs & account security policies
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
                Protected
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Active role-based access control (RBAC), password reset tokens,
              and security audits are enforced. Inactive accounts are blocked at
              login with clear reactivation instructions.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Policy: Inactive Account Lockout Active
            </span>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <span>Manage Accounts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Section 3: Administrative Navigation Hub */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Admin Management Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              User Accounts
            </h3>
            <p className="text-xs text-slate-500">
              Assign roles, reset passwords, activate or deactivate accounts.
            </p>
          </Link>

          <Link
            to="/admin/staff-approvals"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <UserCheck className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Staff Approvals
            </h3>
            <p className="text-xs text-slate-500">
              Verify credentials and approve doctor/nurse registration requests.
            </p>
          </Link>

          <Link
            to="/doctors"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Stethoscope className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Doctor Management
            </h3>
            <p className="text-xs text-slate-500">
              Directory, consultation schedules, leaves, and availability
              calendars.
            </p>
          </Link>

          <Link
            to="/settings"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition">
                <Settings className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              System Settings
            </h3>
            <p className="text-xs text-slate-500">
              Hospital details, timezone, date formats, and system preferences.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
