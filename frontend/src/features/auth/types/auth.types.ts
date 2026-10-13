export enum UserRole {
  Admin = 100,
  HospitalManager = 90,
  Doctor = 80,
  Pharmacist = 75,
  LabTechnician = 70,
  Nurse = 60,
  Receptionist = 40,
  Patient = 20,
}

export interface RoleDto {
  roleId: number;
  name: string;
  description?: string;
  level: number;
  parentRoleId?: number;
  permissions: string[];
}

export interface UserDto {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  employeeId?: string;
  phone?: string;
  role: UserRole | string | number;
  roleName: string;
  hierarchyLevel: number;
  permissions: string[];
  lastLoginAt?: string;
  timeFormat?: "Hour12" | "Hour24" | 12 | 24;
  timeZone?: string;
  language?: string;
}

export function formatRoleDisplay(
  roleName?: string | null,
  role?: UserRole | string | number | null,
): string {
  const raw = String(roleName ?? "").trim();
  const levelOrName =
    /^\d+$/.test(raw) || !raw ? String(role ?? raw).trim() : raw;
  const key = levelOrName.toLowerCase().replace(/[\s_-]/g, "");

  const displayMap: Record<string, string> = {
    admin: "Admin",
    "100": "Admin",
    hospitalmanager: "Hospital Manager",
    "90": "Hospital Manager",
    doctor: "Doctor",
    "80": "Doctor",
    pharmacist: "Pharmacist",
    "75": "Pharmacist",
    labtechnician: "Lab Technician",
    labtech: "Lab Technician",
    "70": "Lab Technician",
    nurse: "Nurse",
    "60": "Nurse",
    receptionist: "Receptionist",
    "40": "Receptionist",
    patient: "Patient",
    "20": "Patient",
  };

  return displayMap[key] || raw || "Staff";
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone?: string;
  timeFormat?: number;
  timeZone?: string;
  language?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
