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

    // Workflow 2: Staff Registration & Admin Approval
    Task<StaffRegistrationRequestDto> SubmitStaffRegistrationRequestAsync(SubmitStaffRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<StaffRegistrationRequestDto>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> ApproveStaffRegistrationRequestAsync(int requestId, int adminUserId, ApproveStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> RejectStaffRegistrationRequestAsync(int requestId, int adminUserId, RejectStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto?> GetStaffRegistrationStatusAsync(string email, CancellationToken cancellationToken = default);
}
