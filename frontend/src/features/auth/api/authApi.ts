import { apiClient } from '../../../lib/axios';
import { AuthResponse, LoginRequest, UserDto } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', JSON.stringify(refreshToken));
    return response.data;
  },
};
