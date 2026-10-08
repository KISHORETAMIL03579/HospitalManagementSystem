using HospitalManagement.Application.Auth.DTOs;

namespace HospitalManagement.Application.Auth.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);
}
