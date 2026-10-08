import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { PatientListPage } from "../features/patients/pages/PatientListPage";
import { PatientCreatePage } from "../features/patients/pages/PatientCreatePage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";

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
            element: <Navigate to="/patients" replace />,
          },
          {
            path: "patients",
            element: <PatientListPage />,
          },
          {
            path: "patients/new",
            element: <PatientCreatePage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/patients" replace />,
  },
]);
