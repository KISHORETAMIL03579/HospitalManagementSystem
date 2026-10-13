import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types/auth.types";

interface ProtectedRouteProps {
  allowedRoles?: (UserRole | string | number)[];
}

const normalizeRoleToLevel = (
  roleOrLevel: UserRole | string | number | undefined,
): number => {
  if (roleOrLevel === undefined || roleOrLevel === null) return 0;
  if (typeof roleOrLevel === "number") return roleOrLevel;
  const str = String(roleOrLevel)
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  switch (str) {
    case "admin":
      return UserRole.Admin;
    case "hospitalmanager":
      return UserRole.HospitalManager;
    case "doctor":
      return UserRole.Doctor;
    case "pharmacist":
      return UserRole.Pharmacist;
    case "labtechnician":
    case "labtech":
      return UserRole.LabTechnician;
    case "nurse":
      return UserRole.Nurse;
    case "receptionist":
      return UserRole.Receptionist;
    case "patient":
      return UserRole.Patient;
    default:
      return Number(str) || 0;
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userLevel =
      normalizeRoleToLevel(user.role) ||
      (typeof user.hierarchyLevel === "number" ? user.hierarchyLevel : 0) ||
      normalizeRoleToLevel(user.roleName);
    const allowedLevels = allowedRoles.map(normalizeRoleToLevel);

    if (!allowedLevels.includes(userLevel)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
