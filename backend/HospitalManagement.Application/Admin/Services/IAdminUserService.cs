using HospitalManagement.Application.Auth.DTOs;

namespace HospitalManagement.Application.Admin.Services;

public interface IAdminUserService
{
    Task<IEnumerable<AdminUserDto>> GetAllUsersForAdminAsync(string? search = null, int? roleId = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<AdminUserDto> CreateUserByAdminAsync(CreateUserByAdminRequest request, CancellationToken cancellationToken = default);
    Task<AdminUserDto> UpdateUserByAdminAsync(int userId, UpdateUserByAdminRequest request, CancellationToken cancellationToken = default);
    Task<AdminUserDto> UpdateUserRoleByAdminAsync(int userId, int roleId, CancellationToken cancellationToken = default);
    Task<AdminUserDto> ToggleUserStatusByAdminAsync(int targetUserId, int currentAdminId, bool isActive, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserByAdminAsync(int targetUserId, int currentAdminId, CancellationToken cancellationToken = default);
    Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);
}
