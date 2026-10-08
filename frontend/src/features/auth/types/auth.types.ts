export enum UserRole {
  Admin = 1,
  Doctor = 2,
  Receptionist = 3,
  Nurse = 4,
  Patient = 5,
}

export interface UserDto {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleName: string;
  lastLoginAt?: string;
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
