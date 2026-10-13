import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  ShieldAlert,
  TestTube,
  Pill,
  CreditCard,
  UserCheck,
  Activity,
  ArrowRight,
  Archive,
  RotateCcw,
  Trash2,
  MoreVertical,
  Check,
  SlidersHorizontal,
  X,
  ExternalLink,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import {
  NotificationCategory,
  NotificationPriority,
  NotificationItem,
} from "../types/notification.types";

const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  Staff: UserCheck,
  Appointments: Calendar,
  Patients: Users,
  System: ShieldAlert,
  Laboratory: TestTube,
  Pharmacy: Pill,
  Billing: CreditCard,
  Clinical: Activity,
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  Staff:
    "bg-indigo-100/90 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800",
  Appointments:
    "bg-blue-100/90 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300/80 dark:border-blue-800",
  Patients:
    "bg-teal-100/90 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300/80 dark:border-teal-800",
  System:
    "bg-rose-100/90 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/80 dark:border-rose-800",
  Laboratory:
    "bg-purple-100/90 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300/80 dark:border-purple-800",
  Pharmacy:
    "bg-amber-100/90 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/80 dark:border-amber-800",
  Billing:
    "bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800",
  Clinical:
    "bg-cyan-100/90 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300/80 dark:border-cyan-800",
};

const PRIORITY_BADGES: Record<
  NotificationPriority,
  { bg: string; text: string; border: string }
> = {
  Urgent: {
    bg: "bg-rose-50 dark:bg-rose-950/80",
    text: "text-rose-700 dark:text-rose-300 font-bold",
    border: "border-rose-300 dark:border-rose-800",
  },
  High: {
    bg: "bg-amber-50 dark:bg-amber-950/80",
    text: "text-amber-700 dark:text-amber-300 font-semibold",
    border: "border-amber-300 dark:border-amber-800",
  },
  Normal: {
    bg: "bg-blue-50 dark:bg-blue-950/80",
    text: "text-blue-700 dark:text-blue-300 font-medium",
    border: "border-blue-200 dark:border-blue-800",
  },
  Low: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400 font-normal",
    border: "border-slate-200 dark:border-slate-700",
  },
};

const formatTimeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeList,
    archivedList,
    unreadCount,
    urgentCount,
    preferences,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotification,
    unarchiveNotification,
    deleteNotification,
    clearAllRead,
    updatePreferences,
  } = useNotifications();

  // Filters & State
  const [activeTab, setActiveTab] = useState<
    "all" | "unread" | "read" | "urgent" | "archived"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState<
    "all" | "today" | "yesterday" | "last7days" | "last30days" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Compute items to display
  const targetList = activeTab === "archived" ? archivedList : activeList;

  const filteredNotifications = useMemo(() => {
    return targetList.filter((item) => {
      // Tab filter
      if (activeTab === "unread" && item.isRead) return false;
      if (activeTab === "read" && !item.isRead) return false;
      if (activeTab === "urgent" && item.priority !== "Urgent") return false;

      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory)
        return false;

      // Priority filter
      if (selectedPriority !== "All" && item.priority !== selectedPriority)
        return false;

      // Date Filter
      if (selectedDateFilter !== "all") {
        const itemDate = new Date(item.createdAt);
        const now = new Date();

        if (selectedDateFilter === "today") {
          const isToday =
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getDate() === now.getDate();
          if (!isToday) return false;
        } else if (selectedDateFilter === "yesterday") {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday =
            itemDate.getFullYear() === yesterday.getFullYear() &&
            itemDate.getMonth() === yesterday.getMonth() &&
            itemDate.getDate() === yesterday.getDate();
          if (!isYesterday) return false;
        } else if (selectedDateFilter === "last7days") {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (itemDate < sevenDaysAgo) return false;
        } else if (selectedDateFilter === "last30days") {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          if (itemDate < thirtyDaysAgo) return false;
        } else if (selectedDateFilter === "custom") {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMessage = item.message.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesCategory) return false;
      }

      return true;
    });
  }, [
    targetList,
    activeTab,
    selectedCategory,
    selectedPriority,
    selectedDateFilter,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  const categories: NotificationCategory[] = [
    "Staff",
    "Appointments",
    "Patients",
    "System",
    "Laboratory",
    "Pharmacy",
    "Billing",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Summary Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>CareFlow Activity Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Stay updated on your clinical tasks, administrative alerts, and
            hospital activities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPrefsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Preferences</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Active */}
        <div
          onClick={() => setActiveTab("all")}
          className={`p-4.5 rounded-2xl border transition cursor-pointer ${
            activeTab === "all"
              ? "bg-blue-50/70 border-blue-400 dark:bg-blue-950/40 dark:border-blue-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>All Notifications</span>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {activeList.length}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Total active alerts
          </p>
        </div>

        {/* Unread */}
        <div
          onClick={() => setActiveTab("unread")}
          className={`p-4.5 rounded-2xl border transition cursor-pointer ${
            activeTab === "unread"
              ? "bg-indigo-50/70 border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Unread</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {unreadCount}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Requires your attention
          </p>
        </div>

        {/* Urgent */}
        <div
          onClick={() => setActiveTab("urgent")}
          className={`p-4.5 rounded-2xl border transition cursor-pointer ${
            activeTab === "urgent"
              ? "bg-rose-50/70 border-rose-400 dark:bg-rose-950/40 dark:border-rose-700 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Urgent</span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {urgentCount}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Critical hospital actions
          </p>
        </div>

        {/* Archived */}
        <div
          onClick={() => setActiveTab("archived")}
          className={`p-4.5 rounded-2xl border transition cursor-pointer ${
            activeTab === "archived"
              ? "bg-slate-100 border-slate-400 dark:bg-slate-800 dark:border-slate-600 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Archived</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Archive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-2">
            {archivedList.length}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Dismissed history
          </p>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
        {/* Row 1: Status Tabs & Search Box */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs font-medium overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({activeList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                activeTab === "unread"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("read")}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                activeTab === "read"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Read ({activeList.length - unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("urgent")}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                activeTab === "urgent"
                  ? "bg-rose-500 text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
              }`}
            >
              Urgent ({urgentCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                activeTab === "archived"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Archived ({archivedList.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-9 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Pills, Priority Selector & Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs pt-0.5">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1 shrink-0">
              Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`h-8 px-3 rounded-lg border transition font-medium flex items-center ${
                selectedCategory === "All"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 font-semibold shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-8 px-3 rounded-lg border transition flex items-center gap-1.5 font-medium ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Right Controls: Priority & Date Filters */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            {/* Priority Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider shrink-0">
                Priority:
              </span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-8 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
                <span>Date:</span>
              </span>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value as any)}
                className="h-8 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 3 (Conditional): Custom Date Range Pickers */}
        {selectedDateFilter === "custom" && (
          <div className="flex items-center gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-wrap text-xs bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Custom Date Range:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-7.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-7.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold ml-1"
              >
                Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Notification List Cards */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Bell className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No notifications found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery ||
              selectedCategory !== "All" ||
              selectedPriority !== "All" ||
              selectedDateFilter !== "all"
                ? "No alerts matching your current filter criteria. Try adjusting your search keywords, category, or date range."
                : "You're completely caught up! New clinical and operational tasks will appear here as they occur."}
            </p>
            {(searchQuery ||
              selectedCategory !== "All" ||
              selectedPriority !== "All" ||
              selectedDateFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedPriority("All");
                  setSelectedDateFilter("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="px-3 py-1.5 text-xs text-blue-600 hover:underline font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const IconComponent = CATEGORY_ICONS[item.category] || Activity;
            const catColor = CATEGORY_COLORS[item.category];
            const priorityBadge = PRIORITY_BADGES[item.priority];
            const isUnread = !item.isRead;

            return (
              <div
                key={item.id}
                className={`group rounded-2xl border border-l-4 transition-all p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isUnread
                    ? "border-blue-200 dark:border-blue-900/70 border-l-blue-600 dark:border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 border-l-slate-300 dark:border-l-slate-700 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Left Section: Icon + Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Category Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-opacity ${
                      isUnread
                        ? `${catColor} shadow-xs`
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Title */}
                      <h3
                        className={`text-sm truncate ${
                          isUnread
                            ? "font-bold text-slate-950 dark:text-white"
                            : "font-normal text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.title}
                      </h3>

                      {/* Visible READ / UNREAD Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                          isUnread
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {isUnread ? "UNREAD" : "READ"}
                      </span>

                      {/* Category Pill */}
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>

                      {/* Priority Badge */}
                      {item.priority !== "Normal" && (
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}
                        >
                          {item.priority}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        isUnread
                          ? "text-slate-700 dark:text-slate-300 font-medium"
                          : "text-slate-500 dark:text-slate-400 font-normal"
                      }`}
                    >
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 stroke-[2]" />
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      <span>·</span>
                      <span>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Visual Dot / Checkmark & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Status Indicator Icon: Blue Dot vs Checkmark */}
                  <div className="hidden sm:flex items-center justify-center mr-0.5">
                    {isUnread ? (
                      <span
                        title="Unread notification"
                        className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950"
                      />
                    ) : (
                      <span title="Read notification">
                        <Check className="h-4 w-4 text-slate-500 dark:text-slate-400 stroke-[2.2]" />
                      </span>
                    )}
                  </div>

                  {/* Action Link (View related item) */}
                  {item.actionUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        markAsRead(item.id);
                        navigate(item.actionUrl!);
                      }}
                      className={`h-8 px-3.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                        isUnread
                          ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span>{item.actionLabel || "View related item"}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  )}

                  {/* Mark Read / Unread toggle */}
                  <button
                    type="button"
                    title={isUnread ? "Mark as read" : "Mark as unread"}
                    onClick={() =>
                      isUnread ? markAsRead(item.id) : markAsUnread(item.id)
                    }
                    className={`h-8 px-3 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                      isUnread
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isUnread ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark as read</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3 h-3 text-slate-500 dark:text-slate-400 stroke-[2.2]" />
                        <span>Mark unread</span>
                      </>
                    )}
                  </button>

                  {/* Archive / Dismiss button */}
                  {item.isArchived ? (
                    <button
                      type="button"
                      title="Restore to active alerts"
                      onClick={() => unarchiveNotification(item.id)}
                      className="h-8 w-8 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 hover:border-emerald-400 transition flex items-center justify-center shadow-2xs active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Dismiss / Archive alert"
                      onClick={() => archiveNotification(item.id)}
                      className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition flex items-center justify-center shadow-2xs active:scale-95"
                    >
                      <Archive className="w-4 h-4 text-slate-700 dark:text-slate-200 stroke-[2]" />
                    </button>
                  )}

                  {/* Delete option */}
                  <button
                    type="button"
                    title="Delete permanently"
                    onClick={() => deleteNotification(item.id)}
                    className="h-8 w-8 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/70 hover:border-rose-300 dark:hover:border-rose-700 transition flex items-center justify-center shadow-2xs active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Preferences Modal */}
      {isPrefsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize which notifications appear in your CareFlow HMS
                  account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrefsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Channels */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notification Channels
                </h4>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      In-App Notifications
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Show badges and real-time popups in topbar
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.inAppAlerts}
                    onChange={(e) =>
                      updatePreferences({ inAppAlerts: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Email Notifications
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Dispatch urgent notifications to work email address
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailAlerts}
                    onChange={(e) =>
                      updatePreferences({ emailAlerts: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Subscribed Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Subscribed Categories
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.categories[cat] ?? true}
                        onChange={(e) =>
                          updatePreferences({
                            categories: {
                              ...preferences.categories,
                              [cat]: e.target.checked,
                            },
                          })
                        }
                        className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrefsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
