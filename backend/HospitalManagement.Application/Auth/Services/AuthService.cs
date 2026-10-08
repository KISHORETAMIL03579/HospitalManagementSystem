using FluentValidation;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterUserRequest> _registerValidator;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterUserRequest> registerValidator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _loginValidator = loginValidator;
        _registerValidator = registerValidator;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var user = await _userRepository.GetByEmailOrUsernameAsync(request.UsernameOrEmail.Trim(), cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"Account '{request.UsernameOrEmail}' is not registered in CareFlow HMS.");
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Incorrect password provided. Please verify your password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("This account has been deactivated.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _userRepository.UpdateAsync(user, cancellationToken);

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        if (await _userRepository.ExistsByEmailAsync(request.Email.Trim(), cancellationToken))
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        if (await _userRepository.ExistsByUsernameAsync(request.Username.Trim(), cancellationToken))
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
        }

        var role = await _userRepository.GetRoleByIdOrNameAsync((int)request.Role, request.Role.ToString(), cancellationToken);

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            RoleId = role?.RoleId ?? 4,
            Role = role!,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _userRepository.AddAsync(user, cancellationToken);

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken, cancellationToken);
        if (user is null || user.RefreshTokenExpiryTime <= DateTime.UtcNow || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user, cancellationToken);

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return user is null ? null : MapToUserDto(user);
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
            Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).ToList()
        });
    }

    private static UserDto MapToUserDto(User u)
    {
        Enum.TryParse<UserRole>(u.Role?.Name, true, out var parsedRole);
        if ((int)parsedRole == 0 && u.Role != null)
        {
            parsedRole = (UserRole)u.Role.Level;
        }

        return new UserDto
        {
            UserId = u.UserId,
            Username = u.Username,
            Email = u.Email,
            FullName = u.FullName,
            Role = parsedRole,
            LastLoginAt = u.LastLoginAt
        };
    }
}
