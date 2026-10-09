import { apiClient } from "../../../lib/axios";
import {
  AuthResponse,
  LoginRequest,
  RegisterUserRequest,
  RoleDto,
  UserDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "../types/auth.types";

export interface AdminUserDto {
  userId: number;
  fullName: string;
  email: string;
  username: string;
  employeeId?: string;
  roleId: number;
  roleName: string;
  roleEnum: number;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface StaffRegistrationRequest {
  id: number;
  fullName: string;
  email: string;
  username: string;
  employeeId?: string;
  departmentId?: number;
  departmentName?: string;
  requestedRoleId: number;
  requestedRoleName: string;
  invitationCode: string;
  status: 0 | 1 | 2; // 0=Pending, 1=Approved, 2=Rejected
  submittedAt: string;
  reviewedAt?: string;
  reviewedByName?: string;
  rejectionReason?: string;

  // Email Delivery Status
  emailStatus: 0 | 1 | 2 | 3 | 4 | 5; // 0=Queued, 1=Sent, 2=Delivered, 3=Failed, 4=Bounced, 5=Retrying
  lastEmailAttempt?: string;
  emailErrorMessage?: string;
  emailLogId?: number;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );
    return response.data;
  },

  register: async (data: RegisterUserRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>("/auth/me");
    return response.data;
  },

  getRoles: async (): Promise<RoleDto[]> => {
    const response = await apiClient.get<RoleDto[]>("/auth/roles");
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/refresh",
      JSON.stringify(refreshToken),
    );
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserDto> => {
    const response = await apiClient.put<UserDto>("/auth/profile", data);
    return response.data;
  },

  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/change-password",
      data,
    );
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  resetPassword: async (data: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      data,
    );
    return response.data;
  },

  // Direct User Management API Endpoints
  getAllAdminUsers: async (params?: {
    search?: string;
    roleId?: number;
    isActive?: boolean;
  }): Promise<AdminUserDto[]> => {
    const response = await apiClient.get<AdminUserDto[]>("/admin/users", {
      params,
    });
    return response.data;
  },

  createAdminUser: async (data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    roleId: number;
    employeeId?: string;
  }): Promise<AdminUserDto> => {
    const response = await apiClient.post<AdminUserDto>("/admin/users", data);
    return response.data;
  },

  updateAdminUser: async (
    id: number,
    data: {
      fullName: string;
      email: string;
      employeeId?: string;
      roleId: number;
    },
  ): Promise<AdminUserDto> => {
    const response = await apiClient.put<AdminUserDto>(
      `/admin/users/${id}`,
      data,
    );
    return response.data;
  },

  updateAdminUserRole: async (
    id: number,
    roleId: number,
  ): Promise<AdminUserDto> => {
    const response = await apiClient.put<AdminUserDto>(
      `/admin/users/${id}/role`,
      { roleId },
    );
    return response.data;
  },

  toggleAdminUserStatus: async (
    id: number,
    isActive: boolean,
  ): Promise<AdminUserDto> => {
    const response = await apiClient.patch<AdminUserDto>(
      `/admin/users/${id}/status`,
      { isActive },
    );
    return response.data;
  },

  deleteAdminUser: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/admin/users/${id}`,
    );
    return response.data;
  },

  // Legacy Approval Support
  submitStaffRegistration: async (
    data: any,
  ): Promise<StaffRegistrationRequest> => {
    const response = await apiClient.post(
      "/auth/staff-registration-requests",
      data,
    );
    return response.data;
  },

  getStaffRequests: async (
    status?: number,
  ): Promise<StaffRegistrationRequest[]> => {
    const response = await apiClient.get("/admin/staff-requests", {
      params: { status },
    });
    return response.data;
  },

  approveStaffRequest: async (
    requestId: number,
    data: { authorizedRoleId?: number; notes?: string },
  ): Promise<StaffRegistrationRequest> => {
    const response = await apiClient.post(
      `/admin/staff-requests/${requestId}/approve`,
      data,
    );
    return response.data;
  },

  rejectStaffRequest: async (
    requestId: number,
    reason: string,
  ): Promise<StaffRegistrationRequest> => {
    const response = await apiClient.post(
      `/admin/staff-requests/${requestId}/reject`,
      { reason },
    );
    return response.data;
  },

  retryStaffEmail: async (
    requestId: number,
  ): Promise<StaffRegistrationRequest> => {
    const response = await apiClient.post(
      `/admin/staff-requests/${requestId}/retry-email`,
    );
    return response.data;
  },

  getRegistrationStatus: async (
    email: string,
  ): Promise<StaffRegistrationRequest> => {
    const response = await apiClient.get("/auth/registration-status", {
      params: { email },
    });
    return response.data;
  },
};
