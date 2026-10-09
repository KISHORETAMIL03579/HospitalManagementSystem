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
    const response = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (data: { email: string; token: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>("/auth/reset-password", data);
    return response.data;
  },

  submitStaffRegistration: async (data: any): Promise<any> => {
    const response = await apiClient.post("/auth/staff-registration-requests", data);
    return response.data;
  },

  getStaffRequests: async (status?: string): Promise<any[]> => {
    const response = await apiClient.get("/admin/staff-requests", { params: { status } });
    return response.data;
  },

  approveStaffRequest: async (requestId: number, data: { authorizedRoleId?: number; notes?: string }): Promise<any> => {
    const response = await apiClient.post(`/admin/staff-requests/${requestId}/approve`, data);
    return response.data;
  },

  rejectStaffRequest: async (requestId: number, reason: string): Promise<any> => {
    const response = await apiClient.post(`/admin/staff-requests/${requestId}/reject`, { reason });
    return response.data;
  },
};
