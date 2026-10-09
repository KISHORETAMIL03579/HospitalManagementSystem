using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Auth.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);

    // Workflow 1: Forgot Password & Email Reset Token
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);

    // Staff Registration Requests (Legacy support)
    Task<StaffRegistrationRequestDto> SubmitStaffRegistrationRequestAsync(SubmitStaffRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<StaffRegistrationRequestDto>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> ApproveStaffRegistrationRequestAsync(int requestId, int adminUserId, ApproveStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> RejectStaffRegistrationRequestAsync(int requestId, int adminUserId, RejectStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto?> GetStaffRegistrationStatusAsync(string email, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> RetryStaffNotificationEmailAsync(int requestId, CancellationToken cancellationToken = default);

    // Direct User Management (Admin Dashboard)
    Task<IEnumerable<AdminUserDto>> GetAllUsersForAdminAsync(string? search = null, int? roleId = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<AdminUserDto> CreateUserByAdminAsync(CreateUserByAdminRequest request, CancellationToken cancellationToken = default);
    Task<AdminUserDto> UpdateUserByAdminAsync(int userId, UpdateUserByAdminRequest request, CancellationToken cancellationToken = default);
    Task<AdminUserDto> UpdateUserRoleByAdminAsync(int userId, int roleId, CancellationToken cancellationToken = default);
    Task<AdminUserDto> ToggleUserStatusByAdminAsync(int targetUserId, int currentAdminId, bool isActive, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserByAdminAsync(int targetUserId, int currentAdminId, CancellationToken cancellationToken = default);
}
