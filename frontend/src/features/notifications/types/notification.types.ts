export type NotificationCategory =
  | "Staff"
  | "Appointments"
  | "Patients"
  | "System"
  | "Laboratory"
  | "Pharmacy"
  | "Billing"
  | "Clinical";

export type NotificationPriority = "Urgent" | "High" | "Normal" | "Low";

export interface NotificationItem {
  id: string;
  userId?: number;
  recipientRoles?: string[]; // Roles that should receive this notification
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  relatedEntityType?:
    | "StaffRequest"
    | "Appointment"
    | "Patient"
    | "EmailLog"
    | "System"
    | "LabOrder";
  relatedEntityId?: string | number;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  isRead: boolean;
  isArchived: boolean;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  inAppAlerts: boolean;
  soundEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
}
