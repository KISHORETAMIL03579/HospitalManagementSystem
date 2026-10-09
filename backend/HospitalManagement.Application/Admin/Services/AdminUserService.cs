using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Application.Admin.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AdminUserService>? _logger;

    public AdminUserService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ILogger<AdminUserService>? logger = null)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<IEnumerable<AdminUserDto>> GetAllUsersForAdminAsync(string? search = null, int? roleId = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllUsersAsync(search, roleId, isActive, cancellationToken);
        return users.Select(MapToAdminUserDto);
    }

    public async Task<AdminUserDto> CreateUserByAdminAsync(CreateUserByAdminRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();
        if (await _userRepository.ExistsByUsernameAsync(normalizedUsername, cancellationToken))
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        var role = await _userRepository.GetRoleByIdOrNameAsync(request.RoleId, null, cancellationToken);
        if (role is null)
        {
            throw new InvalidOperationException("Selected role could not be resolved.");
        }

        var newUser = new User
        {
            Username = normalizedUsername,
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? null : request.EmployeeId.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            RoleId = role.RoleId,
            Role = role,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(newUser, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin created user account '{Username}' with role '{Role}'.", newUser.Username, role.Name);

        return MapToAdminUserDto(newUser);
    }

    public async Task<AdminUserDto> UpdateUserByAdminAsync(int userId, UpdateUserByAdminRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetTrackedByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"User account #{userId} not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.Email) && !user.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.ExistsByEmailAsync(request.Email.Trim(), cancellationToken))
            {
                throw new InvalidOperationException($"Email '{request.Email}' is already in use by another user.");
            }
            user.Email = request.Email.Trim().ToLowerInvariant();
        }

        if (request.RoleId > 0 && user.RoleId != request.RoleId)
        {
            var role = await _userRepository.GetRoleByIdOrNameAsync(request.RoleId, null, cancellationToken);
            if (role is null) throw new InvalidOperationException("Selected role is invalid.");
            user.RoleId = role.RoleId;
        }

        user.EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? user.EmployeeId : request.EmployeeId.Trim();
        if (request.Phone != null)
        {
            user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        }

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin updated details for user #{UserId} ('{Email}').", user.UserId, user.Email);

        var reloaded = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return MapToAdminUserDto(reloaded ?? user);
    }

    public async Task<AdminUserDto> UpdateUserRoleByAdminAsync(int userId, int roleId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetTrackedByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"User account #{userId} not found.");
        }

        var role = await _userRepository.GetRoleByIdOrNameAsync(roleId, null, cancellationToken);
        if (role is null)
        {
            throw new InvalidOperationException("Target role not found.");
        }

        user.RoleId = role.RoleId;

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin changed role for user #{UserId} to '{Role}'.", user.UserId, role.Name);

        var reloaded = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return MapToAdminUserDto(reloaded ?? user);
    }

    public async Task<AdminUserDto> ToggleUserStatusByAdminAsync(int targetUserId, int currentAdminId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetTrackedByIdAsync(targetUserId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"User account #{targetUserId} not found.");
        }

        // Security check: Prevent self-deactivation
        if (targetUserId == currentAdminId && !isActive)
        {
            throw new InvalidOperationException("Administrators are prohibited from deactivating their own account.");
        }

        // Security check: Prevent deactivating the last active administrator
        if (!isActive)
        {
            var targetUserProjected = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
            if (targetUserProjected?.Role != null && targetUserProjected.Role.Name == "Admin")
            {
                var activeAdminCount = await _userRepository.GetActiveAdminCountAsync(cancellationToken);
                if (activeAdminCount <= 1)
                {
                    throw new InvalidOperationException("Cannot deactivate the last active administrator account in the system.");
                }
            }
        }

        user.IsActive = isActive;
        if (!isActive)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
        }

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin #{AdminId} changed status of user #{TargetUserId} to IsActive={IsActive}.", currentAdminId, targetUserId, isActive);

        var reloaded = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        return MapToAdminUserDto(reloaded ?? user);
    }

    public async Task<bool> DeleteUserByAdminAsync(int targetUserId, int currentAdminId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetTrackedByIdAsync(targetUserId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"User account #{targetUserId} not found.");
        }

        if (targetUserId == currentAdminId)
        {
            throw new InvalidOperationException("Administrators are prohibited from removing their own account.");
        }

        var targetUserProjected = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (targetUserProjected?.Role != null && targetUserProjected.Role.Name == "Admin")
        {
            var activeAdminCount = await _userRepository.GetActiveAdminCountAsync(cancellationToken);
            if (activeAdminCount <= 1)
            {
                throw new InvalidOperationException("Cannot remove the last active administrator account in the system.");
            }
        }

        // Soft deletion: Deactivate and revoke refresh tokens to preserve medical record foreign keys and audit history
        user.IsActive = false;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin #{AdminId} soft-deleted user #{TargetUserId} ('{Email}'). Medical history preserved.", currentAdminId, targetUserId, user.Email);

        return true;
    }

    public async Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _userRepository.GetActiveRolesAsync(cancellationToken);
        return roles.Select(r => new RoleDto
        {
            RoleId = r.RoleId,
            Name = r.Name,
            Description = r.Description,
            Level = r.Level,
            ParentRoleId = r.ParentRoleId,
            Permissions = r.RolePermissions?.Select(rp => rp.Permission?.Name).Where(p => p != null).ToList()!
        });
    }

    private static AdminUserDto MapToAdminUserDto(User u)
    {
        Enum.TryParse<UserRole>(u.Role?.Name, true, out var parsedRole);
        if ((int)parsedRole == 0 && u.Role != null)
        {
            parsedRole = (UserRole)u.Role.Level;
        }

        return new AdminUserDto
        {
            UserId = u.UserId,
            FullName = u.FullName,
            Email = u.Email,
            Username = u.Username,
            EmployeeId = u.EmployeeId,
            Phone = u.Phone,
            RoleId = u.RoleId,
            RoleName = u.Role?.Name ?? "Staff",
            RoleEnum = parsedRole,
            IsActive = u.IsActive,
            LastLoginAt = u.LastLoginAt,
            CreatedAt = u.CreatedAt
        };
    }
}
