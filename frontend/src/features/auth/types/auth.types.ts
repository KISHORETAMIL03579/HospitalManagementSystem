export enum UserRole {
  Admin = 100,
  Doctor = 80,
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
  phone?: string;
  role: UserRole;
  roleName: string;
  hierarchyLevel: number;
  permissions: string[];
  lastLoginAt?: string;
  timeFormat?: "Hour12" | "Hour24" | 12 | 24;
  timeZone?: string;
  language?: string;
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
