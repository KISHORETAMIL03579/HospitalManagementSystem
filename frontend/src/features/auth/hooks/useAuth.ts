import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { LoginRequest, UserDto } from '../types/auth.types';

export function useAuth() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('hms_token');

  const userQuery = useQuery<UserDto | null>({
    queryKey: ['auth_user'],
    queryFn: async () => {
      if (!token) return null;
      try {
        return await authApi.getCurrentUser();
      } catch {
        localStorage.removeItem('hms_token');
        return null;
      }
    },
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('hms_token', data.token);
      localStorage.setItem('hms_user', JSON.stringify(data.user));
      queryClient.setQueryData(['auth_user'], data.user);
    },
  });

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    queryClient.setQueryData(['auth_user'], null);
    window.location.href = '/login';
  };

  return {
    user: userQuery.data || (localStorage.getItem('hms_user') ? JSON.parse(localStorage.getItem('hms_user')!) : null),
    isAuthenticated: !!token && (!!userQuery.data || !!localStorage.getItem('hms_user')),
    isLoading: userQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
  };
}
