import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
  NotificationPreferences,
} from "../types/notification.types";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailAlerts: true,
  inAppAlerts: true,
  soundEnabled: false,
  categories: {
    Staff: true,
    Appointments: true,
    Patients: true,
    System: true,
    Laboratory: true,
    Pharmacy: true,
    Billing: true,
    Clinical: true,
  },
};

const getInitialNotificationsForRole = (
  roleName: string,
  userName: string,
): NotificationItem[] => {
  const role = roleName.toLowerCase().replace(/[\s_-]/g, "");

  // Base list of notifications tailored to CareFlow HMS roles
  const allMockNotifications: NotificationItem[] = [
    {
      id: "notif-1",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "New staff approval request",
      message:
        "Priya Sharma submitted an onboarding request for Receptionist role. Action required.",
      category: "Staff",
      priority: "High",
      relatedEntityType: "StaffRequest",
      relatedEntityId: 3,
      actionUrl: "/admin/staff-approvals",
      actionLabel: "Review Application",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-2",
      recipientRoles: [
        "doctor",
        "nurse",
        "receptionist",
        "admin",
        "hospitalmanager",
      ],
      title: "Appointment rescheduled",
      message:
        "Patient Emma Watson rescheduled consultation with Dr. Eleanor Vance to tomorrow at 10:30 AM.",
      category: "Appointments",
      priority: "Normal",
      relatedEntityType: "Appointment",
      relatedEntityId: 102,
      actionUrl: "/appointments",
      actionLabel: "View Schedule",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min ago
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-3",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "Email delivery notice",
      message:
        "Registration dispatch to priya@example.com was re-sent and recorded successfully via Mailpit.",
      category: "System",
      priority: "Urgent",
      relatedEntityType: "EmailLog",
      relatedEntityId: "mailpit",
      actionUrl: "/admin/staff-approvals",
      actionLabel: "Inspect Delivery",
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-4",
      recipientRoles: ["receptionist", "nurse", "admin", "hospitalmanager"],
      title: "Patient registration completed",
      message:
        "New patient Sarah Connor (MRN-2026-004) intake form completed and admitted for triage.",
      category: "Patients",
      priority: "Normal",
      relatedEntityType: "Patient",
      relatedEntityId: 4,
      actionUrl: "/patients",
      actionLabel: "Open EMR Record",
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-5",
      recipientRoles: ["doctor", "clinical", "hospitalmanager"],
      title: "Urgent Lab Result Available",
      message:
        "Stat cardiac enzyme panel completed for patient Robert Downey (MRN-2026-003). Elevated troponin flagged.",
      category: "Laboratory",
      priority: "Urgent",
      relatedEntityType: "LabOrder",
      relatedEntityId: 88,
      actionUrl: "/patients",
      actionLabel: "Review Lab Panel",
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(), // 3 hours ago
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-6",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "Staff Account Approved",
      message:
        "Dr. Sarah Jenkins account credentials activated with role Doctor under Cardiology.",
      category: "Staff",
      priority: "Normal",
      relatedEntityType: "StaffRequest",
      relatedEntityId: 6,
      actionUrl: "/admin/users",
      actionLabel: "Manage User",
      createdAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(), // 5 hours ago
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-7",
      recipientRoles: ["pharmacist", "nurse", "admin", "hospitalmanager"],
      title: "Pharmacy low-stock alert",
      message:
        "Inventory threshold reached: Amoxicillin 500mg capsules below minimum 50 unit reserve.",
      category: "Pharmacy",
      priority: "High",
      actionUrl: "/dashboard",
      actionLabel: "Inspect Stock",
      createdAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(), // 8 hours ago
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-8",
      recipientRoles: ["receptionist", "hospitalmanager", "admin"],
      title: "Billing invoice finalized",
      message:
        "Outpatient consultation invoice #INV-8902 generated for patient John Smith.",
      category: "Billing",
      priority: "Low",
      actionUrl: "/appointments",
      actionLabel: "View Receipt",
      createdAt: new Date(Date.now() - 720 * 60 * 1000).toISOString(), // 12 hours ago
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-9",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "Daily Audit & Backup Completed",
      message:
        "Clinical EMR database encrypted snapshot persisted successfully. ABDM compliance verified.",
      category: "System",
      priority: "Low",
      actionUrl: "/settings",
      actionLabel: "View Security Logs",
      createdAt: new Date(Date.now() - 1440 * 60 * 1000).toISOString(), // 1 day ago
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-10",
      recipientRoles: ["patient"],
      title: "Appointment Confirmed",
      message:
        "Your appointment with Dr. Eleanor Vance on Cardiology is confirmed for tomorrow at 10:00 AM.",
      category: "Appointments",
      priority: "High",
      relatedEntityType: "Appointment",
      actionUrl: "/appointments",
      actionLabel: "My Appointments",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      isRead: false,
      isArchived: false,
    },
  ];

  // Filter based on recipient roles
  return allMockNotifications.filter((n) => {
    if (!n.recipientRoles || n.recipientRoles.length === 0) return true;
    return (
      n.recipientRoles.includes(role) ||
      (role === "admin" && !n.recipientRoles.includes("patient"))
    );
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  const storageKey = `careflow_notifications_${user?.userId || user?.username || "default"}`;
  const prefsKey = `careflow_notif_prefs_${user?.userId || user?.username || "default"}`;

  const roleName = user?.roleName || user?.role || "Admin";

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached notifications", e);
      }
    }
    return getInitialNotificationsForRole(
      String(roleName),
      user?.fullName || "Staff",
    );
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    () => {
      const cached = localStorage.getItem(prefsKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached notification preferences", e);
        }
      }
      return DEFAULT_PREFERENCES;
    },
  );

  // Persist to storage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, storageKey]);

  useEffect(() => {
    localStorage.setItem(prefsKey, JSON.stringify(preferences));
  }, [preferences, prefsKey]);

  // Actions
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const markAsUnread = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const archiveNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isArchived: true } : n)),
    );
  }, []);

  const unarchiveNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isArchived: false } : n)),
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllRead = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
  }, []);

  const updatePreferences = useCallback(
    (newPrefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...newPrefs }));
    },
    [],
  );

  // Metrics
  const activeList = useMemo(
    () => notifications.filter((n) => !n.isArchived),
    [notifications],
  );

  const archivedList = useMemo(
    () => notifications.filter((n) => n.isArchived),
    [notifications],
  );

  const unreadCount = useMemo(
    () => activeList.filter((n) => !n.isRead).length,
    [activeList],
  );

  const urgentCount = useMemo(
    () => activeList.filter((n) => !n.isRead && n.priority === "Urgent").length,
    [activeList],
  );

  return {
    notifications,
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
  };
};
