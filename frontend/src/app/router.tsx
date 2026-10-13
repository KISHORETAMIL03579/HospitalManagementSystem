import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { PatientListPage } from "../features/patients/pages/PatientListPage";
import { PatientCreatePage } from "../features/patients/pages/PatientCreatePage";
import { DoctorListPage } from "../features/doctors/pages/DoctorListPage";
import { AppointmentListPage } from "../features/appointments/pages/AppointmentListPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { ContactPage } from "../features/auth/pages/ContactPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { NotificationPage } from "../features/notifications/pages/NotificationPage";
import { UserManagementPage } from "../features/admin/pages/UserManagementPage";
import { StaffApprovalPage } from "../features/admin/pages/StaffApprovalPage";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage";
import { UserRole } from "../features/auth/types/auth.types";

const STAFF_ROLES = [
  UserRole.Admin,
  UserRole.HospitalManager,
  UserRole.Doctor,
  UserRole.Nurse,
  UserRole.Receptionist,
];

const ADMIN_ROLES = [UserRole.Admin, UserRole.HospitalManager];

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "patients",
            element: <PatientListPage />,
          },
          {
            element: <ProtectedRoute allowedRoles={STAFF_ROLES} />,
            children: [
              {
                path: "patients/new",
                element: <PatientCreatePage />,
              },
              {
                path: "doctors",
                element: <DoctorListPage />,
              },
            ],
          },
          {
            path: "appointments",
            element: <AppointmentListPage />,
          },
          {
            element: <ProtectedRoute allowedRoles={ADMIN_ROLES} />,
            children: [
              {
                path: "admin",
                element: <AdminDashboardPage />,
              },
              {
                path: "admin/users",
                element: <UserManagementPage />,
              },
              {
                path: "admin/staff-approvals",
                element: <StaffApprovalPage />,
              },
            ],
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
          {
            path: "notifications",
            element: <NotificationPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
