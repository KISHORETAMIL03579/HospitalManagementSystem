import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { authApi } from "../../auth/api/authApi";
import {
  applyThemeMode,
  applyFontSize,
  applyDensityMode,
  notifySettingsChanged,
} from "../../../utils/dateUtils";
import {
  User,
  Sun,
  Moon,
  Globe,
  Bell,
  Shield,
  Sliders,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Monitor,
  Clock,
  Save,
  RotateCcw,
  Camera,
  Building2,
  Hash,
  Activity,
  LogOut,
  Laptop,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

type SettingsTab =
  | "profile"
  | "appearance"
  | "regional"
  | "notifications"
  | "security"
  | "preferences"
  | "about";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Tab 1: Profile State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "+1 (555) 019-2831");
  const [department, setDepartment] = useState(
    "General Medicine & Clinical Operations",
  );
  const employeeId = `EMP-2026-0${user?.userId || "101"}`;

  // Tab 2: Appearance State
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    (localStorage.getItem("careflow_theme") as any) || "light",
  );
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    (localStorage.getItem("careflow_fontSize") as any) || "medium",
  );
  const [density, setDensity] = useState<"compact" | "comfortable">(
    (localStorage.getItem("careflow_density") as any) || "comfortable",
  );

  // Tab 3: Regional State
  const [timeFormat, setTimeFormat] = useState<"12" | "24">(
    (localStorage.getItem("careflow_timeFormat") as "12" | "24") || "12",
  );
  const [timeZone, setTimeZone] = useState<string>(
    localStorage.getItem("careflow_timeZone") || "Asia/Kolkata",
  );
  const [dateFormat, setDateFormat] = useState<string>(
    localStorage.getItem("careflow_dateFormat") || "DD/MM/YYYY",
  );
  const [language, setLanguage] = useState<string>(
    localStorage.getItem("careflow_language") || "en-US",
  );
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<"monday" | "sunday">(
    (localStorage.getItem("careflow_firstDay") as any) || "monday",
  );

  // Tab 4: Notification State
  const [notifAppointment, setNotifAppointment] = useState(true);
  const [notifAdmission, setNotifAdmission] = useState(true);
  const [notifDischarge, setNotifDischarge] = useState(false);
  const [notifStock, setNotifStock] = useState(true);
  const [notifBilling, setNotifBilling] = useState(true);
  const [emailChannel, setEmailChannel] = useState(true);
  const [inAppChannel, setInAppChannel] = useState(true);

  // Tab 5: Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState<string>("30");

  // Tab 6: Preferences State
  const [defaultDashboard, setDefaultDashboard] = useState("overview");
  const [defaultPatientView, setDefaultPatientView] = useState("table");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [defaultApptView, setDefaultApptView] = useState("week");

  // Messages & Loading
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialFullName = user?.fullName || "";
  const initialEmail = user?.email || "";
  const initialPhone = user?.phone || "+1 (555) 019-2831";
  const initialDepartment = "General Medicine & Clinical Operations";

  const isProfileDirty =
    fullName !== initialFullName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    department !== initialDepartment;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await authApi.updateProfile({
        fullName,
        email,
        phone,
        timeFormat: timeFormat === "12" ? 12 : 24,
        timeZone,
        language,
      });

      if (updatedUser) {
        localStorage.setItem("hms_user", JSON.stringify(updatedUser));
        queryClient.setQueryData(["auth_user"], updatedUser);
      }

      // Save local storage preferences
      localStorage.setItem("careflow_timeFormat", timeFormat);
      localStorage.setItem("careflow_timeZone", timeZone);
      localStorage.setItem("careflow_theme", theme);
      localStorage.setItem("careflow_language", language);
      localStorage.setItem("careflow_dateFormat", dateFormat);
      localStorage.setItem("careflow_fontSize", fontSize);
      localStorage.setItem("careflow_density", density);

      applyThemeMode(theme);

      showNotification(
        "Profile and preferences saved successfully to the server database!",
      );
    } catch (err: any) {
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile settings.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification("New password and confirmation do not match.", true);
      return;
    }
    if (newPassword.length < 6) {
      showNotification(
        "New password must be at least 6 characters long.",
        true,
      );
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showNotification("Password changed successfully!");
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || "Password update failed.",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRegional = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("careflow_timeFormat", timeFormat);
      localStorage.setItem("careflow_timeZone", timeZone);
      localStorage.setItem("careflow_dateFormat", dateFormat);
      localStorage.setItem("careflow_language", language);
      localStorage.setItem("careflow_firstDay", firstDayOfWeek);

      notifySettingsChanged();

      showNotification(
        "Regional settings & time format preferences saved successfully!",
      );
    } catch {
      showNotification("Failed to save regional settings.", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = () => {
    localStorage.setItem("careflow_theme", theme);
    localStorage.setItem("careflow_fontSize", fontSize);
    localStorage.setItem("careflow_density", density);
    applyThemeMode(theme);
    applyFontSize(fontSize);
    applyDensityMode(density);
    notifySettingsChanged();
    showNotification(
      "Appearance & visual layout preferences saved successfully!",
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const tabs = [
    {
      id: "profile" as SettingsTab,
      label: "Profile",
      icon: User,
      desc: "Personal info & role details",
    },
    {
      id: "appearance" as SettingsTab,
      label: "Appearance",
      icon: Sun,
      desc: "Theme & layout density",
    },
    {
      id: "regional" as SettingsTab,
      label: "Regional Settings",
      icon: Clock,
      desc: "Time zone & date formats",
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      icon: Bell,
      desc: "Alerts & email preferences",
    },
    {
      id: "security" as SettingsTab,
      label: "Security & Privacy",
      icon: Shield,
      desc: "Password & sessions",
    },
    {
      id: "preferences" as SettingsTab,
      label: "Preferences",
      icon: Sliders,
      desc: "System default views",
    },
    {
      id: "about" as SettingsTab,
      label: "Help & About",
      icon: HelpCircle,
      desc: "System info & support",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-100">
            {getInitials(user?.fullName)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {user?.fullName || "Account Settings"}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                {user?.roleName || "User"}
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-3">
              <span>{user?.email}</span>
              <span>•</span>
              <span className="font-mono text-slate-600">ID: {employeeId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Connected
          </span>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-semibold animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-sm font-semibold animate-fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Layout (Sidebar Navigation + Tab Content) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`}
                />
                <div>
                  <div className="text-sm leading-tight">{tab.label}</div>
                  <div
                    className={`text-[11px] ${isActive ? "text-indigo-100" : "text-slate-400"}`}
                  >
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-8 lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-5 h-5 text-indigo-600" />
                  Personal Information & Role Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your personal contact information. System roles and
                  access permissions are managed by Administrators.
                </p>
              </div>

              {/* Photo Avatar Row */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-inner">
                    {getInitials(fullName)}
                  </div>
                  <button
                    type="button"
                    title="Upload new avatar"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-indigo-600 shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {fullName || "User Name"}
                  </h3>
                  <p className="text-xs text-slate-500">{department}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    JPG/PNG up to 2MB supported
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Read-Only System Identity Details */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Read-Only System Authorization Attributes
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Account
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500">Employee ID:</span>
                      <span className="ml-2 font-mono font-semibold text-slate-800">
                        {employeeId}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500">Assigned Role:</span>
                      <span className="ml-2 font-semibold text-indigo-700 capitalize">
                        {user?.roleName || "User"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Note: These attributes are managed through authorized
                  administration. Users cannot self-modify assigned clinical
                  roles or permission levels.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={!isProfileDirty}
                  onClick={() => {
                    setFullName(initialFullName);
                    setEmail(initialEmail);
                    setPhone(initialPhone);
                    setDepartment(initialDepartment);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={!isProfileDirty || isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sun className="w-5 h-5 text-indigo-600" />
                  Appearance & Customization
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Customize theme modes, font sizing, and visual density across
                  the hospital workspace.
                </p>
              </div>

              {/* Theme Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-3">
                  Interface Color Theme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("light");
                      localStorage.setItem("careflow_theme", "light");
                      applyThemeMode("light");
                    }}
                    className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                      theme === "light"
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Sun className="w-6 h-6 text-amber-500" />
                    <span className="text-xs">Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme("dark");
                      localStorage.setItem("careflow_theme", "dark");
                      applyThemeMode("dark");
                    }}
                    className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                      theme === "dark"
                        ? "border-indigo-600 bg-slate-900 text-white font-bold ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Moon className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs">Dark Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme("system");
                      localStorage.setItem("careflow_theme", "system");
                      applyThemeMode("system");
                    }}
                    className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                      theme === "system"
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Monitor className="w-6 h-6 text-slate-600" />
                    <span className="text-xs">System Default</span>
                  </button>
                </div>
              </div>

              {/* Font Size Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  System Font Sizing
                </label>
                <div className="flex items-center gap-3">
                  {(["small", "medium", "large"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setFontSize(sz);
                        localStorage.setItem("careflow_fontSize", sz);
                        applyFontSize(sz);
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition ${
                        fontSize === sz
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {sz} (
                      {sz === "small"
                        ? "13px"
                        : sz === "medium"
                          ? "14px"
                          : "16px"}
                      )
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Density */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Grid & Table Visual Density
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDensity("comfortable");
                      localStorage.setItem("careflow_density", "comfortable");
                      applyDensityMode("comfortable");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      density === "comfortable"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold">Comfortable</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Spacious padding for touchscreen devices
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDensity("compact");
                      localStorage.setItem("careflow_density", "compact");
                      applyDensityMode("compact");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      density === "compact"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold">Compact</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Dense table rows for high data viewability
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAppearance}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Appearance Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REGIONAL & TIME */}
          {activeTab === "regional" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Regional Settings & Time Formats
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure 12/24-hour clock displays, operating time zones,
                  date formats, and localization preferences.
                </p>
              </div>

              {/* Time Format Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Time Display Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      timeFormat === "12"
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeFormat"
                      value="12"
                      checked={timeFormat === "12"}
                      onChange={() => {
                        setTimeFormat("12");
                        localStorage.setItem("careflow_timeFormat", "12");
                        notifySettingsChanged();
                      }}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm">12-Hour Format</div>
                      <div className="text-xs text-slate-400 font-mono">
                        10:30 AM / 02:45 PM
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      timeFormat === "24"
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeFormat"
                      value="24"
                      checked={timeFormat === "24"}
                      onChange={() => {
                        setTimeFormat("24");
                        localStorage.setItem("careflow_timeFormat", "24");
                        notifySettingsChanged();
                      }}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm">24-Hour Format</div>
                      <div className="text-xs text-slate-400 font-mono">
                        10:30 / 14:45
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Time Zone Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Operating Time Zone
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => {
                      setTimeZone(e.target.value);
                      localStorage.setItem("careflow_timeZone", e.target.value);
                      notifySettingsChanged();
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Asia/Kolkata">
                      Asia/Kolkata (IST - UTC+05:30)
                    </option>
                    <option value="UTC">
                      UTC (Coordinated Universal Time)
                    </option>
                    <option value="America/New_York">
                      America/New_York (EST - UTC-05:00)
                    </option>
                    <option value="Europe/London">
                      Europe/London (GMT - UTC+00:00)
                    </option>
                    <option value="Asia/Dubai">
                      Asia/Dubai (GST - UTC+04:00)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Formatting
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => {
                      setDateFormat(e.target.value);
                      localStorage.setItem(
                        "careflow_dateFormat",
                        e.target.value,
                      );
                      notifySettingsChanged();
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="DD/MM/YYYY">
                      DD/MM/YYYY (e.g. 09/10/2026)
                    </option>
                    <option value="MM/DD/YYYY">
                      MM/DD/YYYY (e.g. 10/09/2026)
                    </option>
                    <option value="YYYY-MM-DD">
                      YYYY-MM-DD (ISO standard)
                    </option>
                  </select>
                </div>
              </div>

              {/* Language & First Day of Week */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application Interface Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      localStorage.setItem("careflow_language", e.target.value);
                      notifySettingsChanged();
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="es-ES">Spanish (Español)</option>
                    <option value="fr-FR">French (Français)</option>
                    <option value="hi-IN">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calendar First Day of Week
                  </label>
                  <select
                    value={firstDayOfWeek}
                    onChange={(e) => {
                      setFirstDayOfWeek(e.target.value as any);
                      localStorage.setItem("careflow_firstDay", e.target.value);
                      notifySettingsChanged();
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveRegional}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />{" "}
                  {isSaving ? "Saving..." : "Save Regional Settings"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Clinical & Operational Notifications
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage alert preferences for patient consultations,
                  admissions, stock warnings, and billing events.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: "appt",
                    label: "Appointment Reminders & Changes",
                    desc: "Alerts when consultation status changes or new bookings are confirmed",
                    state: notifAppointment,
                    setter: setNotifAppointment,
                  },
                  {
                    id: "admit",
                    label: "Patient Admission & Emergency Alerts",
                    desc: "Urgent notifications for emergency intake and ward transfers",
                    state: notifAdmission,
                    setter: setNotifAdmission,
                  },
                  {
                    id: "discharge",
                    label: "Discharge & Outpatient Summary Notifications",
                    desc: "Updates when patient billing and discharge summaries are finalized",
                    state: notifDischarge,
                    setter: setNotifDischarge,
                  },
                  {
                    id: "stock",
                    label: "Pharmacy & Inventory Low-Stock Alerts",
                    desc: "Automated warnings when essential pharmaceuticals fall below safety threshold",
                    state: notifStock,
                    setter: setNotifStock,
                  },
                  {
                    id: "billing",
                    label: "Billing & Claims Clearance Notifications",
                    desc: "Alerts when invoice payments or insurance pre-authorizations resolve",
                    state: notifBilling,
                    setter: setNotifBilling,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-400">{item.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Delivery Channels */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Notification Delivery Channels
                </h4>
                <div className="flex gap-6 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={emailChannel}
                      onChange={(e) => setEmailChannel(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Email Notifications ({user?.email})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={inAppChannel}
                      onChange={(e) => setInAppChannel(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>In-App Banner Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & PRIVACY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Security & Authentication Controls
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update account credentials, configure two-factor
                  authentication, and monitor active sessions.
                </p>
              </div>

              {/* Change Password Form */}
              <form
                onSubmit={handleChangePassword}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-4"
              >
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  Change User Password
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                          placeholder="Min 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                  >
                    Update Password
                  </button>
                </div>
              </form>

              {/* 2FA & Auto Logout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Two-Factor Authentication (2FA)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Require authenticator code on login
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Inactivity Auto-Logout
                  </label>
                  <select
                    value={autoLogoutMinutes}
                    onChange={(e) => setAutoLogoutMinutes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="15">15 Minutes of Inactivity</option>
                    <option value="30">30 Minutes of Inactivity</option>
                    <option value="60">1 Hour of Inactivity</option>
                    <option value="never">Never (Stay Logged In)</option>
                  </select>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Active System Logins
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      showNotification(
                        "Logged out from all other remote sessions.",
                      )
                    }
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Log Out All Other Devices
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Laptop className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-slate-800">
                          Chrome on Windows 11 (Current Session)
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          IP: 127.0.0.1 • Active Now
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Application Default Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure default view modes, pagination row counts, and
                  starting landing pages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Starting Landing Page
                  </label>
                  <select
                    value={defaultDashboard}
                    onChange={(e) => setDefaultDashboard(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="overview">
                      Executive Overview Dashboard
                    </option>
                    <option value="appointments">Appointments Calendar</option>
                    <option value="patients">Patients Registry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Patient Directory View
                  </label>
                  <select
                    value={defaultPatientView}
                    onChange={(e) => setDefaultPatientView(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="table">
                      Table View (Detailed 7 Columns)
                    </option>
                    <option value="grid">Grid Card View</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Table Rows Per Page
                  </label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="10">10 Rows Per Page</option>
                    <option value="25">25 Rows Per Page</option>
                    <option value="50">50 Rows Per Page</option>
                    <option value="100">100 Rows Per Page</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Appointment Calendar Span
                  </label>
                  <select
                    value={defaultApptView}
                    onChange={(e) => setDefaultApptView(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="day">Day View</option>
                    <option value="week">Week View</option>
                    <option value="month">Month View</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: HELP & ABOUT */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  System Identification & Support
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  CareFlow Hospital Management System architectural
                  specifications and technical support.
                </p>
              </div>

              {/* System Card */}
              <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                      <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        CareFlow HMS
                      </h3>
                      <p className="text-xs text-indigo-200">
                        Production Clinical Operations Management Suite
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    v3.2.0-prod
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Backend Framework
                    </span>
                    <span className="font-medium text-slate-200">
                      ASP.NET Core 10
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Database Storage
                    </span>
                    <span className="font-medium text-slate-200">
                      SQL Server LocalDB
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Frontend Stack
                    </span>
                    <span className="font-medium text-slate-200">
                      React 19 + TypeScript
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Security Model
                    </span>
                    <span className="font-medium text-slate-200">
                      Dynamic RBAC
                    </span>
                  </div>
                </div>
              </div>

              {/* Help & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800">
                    Hospital IT Technical Support
                  </h4>
                  <p className="text-slate-500">
                    Need assistance or reporting system anomalies?
                  </p>
                  <div className="font-medium text-indigo-600">
                    support@careflow.com • Ext. 4400
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800">
                    Documentation & Policy Standard
                  </h4>
                  <p className="text-slate-500">
                    View HL7 FHIR clinical guidelines and user manual.
                  </p>
                  <div className="font-medium text-indigo-600">
                    https://careflow-hms.internal/docs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
