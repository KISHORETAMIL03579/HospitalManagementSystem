import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { PatientListPage } from "../features/patients/pages/PatientListPage";
import { PatientCreatePage } from "../features/patients/pages/PatientCreatePage";
import { DoctorListPage } from "../features/doctors/pages/DoctorListPage";
import { AppointmentListPage } from "../features/appointments/pages/AppointmentListPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
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
            path: "patients/new",
            element: <PatientCreatePage />,
          },
          {
            path: "doctors",
            element: <DoctorListPage />,
          },
          {
            path: "appointments",
            element: <AppointmentListPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
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
