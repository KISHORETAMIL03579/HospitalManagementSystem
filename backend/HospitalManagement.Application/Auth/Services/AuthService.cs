using System.Security.Cryptography;
using FluentValidation;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailService _emailService;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterUserRequest> _registerValidator;
    private readonly ILogger<AuthService>? _logger;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailService emailService,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterUserRequest> registerValidator,
        ILogger<AuthService>? logger = null)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailService = emailService;
        _loginValidator = loginValidator;
        _registerValidator = registerValidator;
        _logger = logger;
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
            throw new UnauthorizedAccessException("This account has been deactivated or is awaiting administrative approval.");
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
        // 1. FluentValidation
        var validationResult = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        // 2. Uniqueness Checks
        if (await _userRepository.ExistsByEmailAsync(request.Email.Trim(), cancellationToken))
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        if (await _userRepository.ExistsByUsernameAsync(request.Username.Trim(), cancellationToken))
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
        }

        // 3. Server-Side Invitation Validation
        if (string.IsNullOrWhiteSpace(request.InvitationCode))
        {
            throw new InvalidOperationException("Invitation code is required for staff registration.");
        }

        var invitation = await _userRepository.GetInvitationByCodeAsync(request.InvitationCode.Trim(), cancellationToken);
        if (invitation is null)
        {
            throw new InvalidOperationException("Invalid or unrecognized invitation code.");
        }

        if (invitation.IsUsed)
        {
            throw new InvalidOperationException("This invitation code has already been used.");
        }

        if (invitation.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("This invitation code has expired.");
        }

        if (!string.IsNullOrWhiteSpace(invitation.BoundEmail) &&
            !invitation.BoundEmail.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invitation code is restricted to a specific email address.");
        }

        if (!string.IsNullOrWhiteSpace(invitation.BoundEmployeeId) &&
            !invitation.BoundEmployeeId.Equals(request.EmployeeId?.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invitation code is restricted to a specific employee ID.");
        }

        // 4. SERVER-ENFORCED ROLE ASSIGNMENT
        var authorizedRole = invitation.TargetRole
            ?? await _userRepository.GetRoleByIdOrNameAsync(invitation.TargetRoleId, null, cancellationToken);

        if (authorizedRole is null)
        {
            throw new InvalidOperationException("Authorized role associated with invitation code could not be resolved.");
        }

        // 5. Transactional User Creation
        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? null : request.EmployeeId.Trim(),
            RoleId = authorizedRole.RoleId,
            Role = authorizedRole,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _userRepository.AddAsync(user, cancellationToken);

        // Mark Invitation Code as Used once
        await _userRepository.MarkInvitationAsUsedAsync(invitation.InvitationCodeId, user.UserId, cancellationToken);

        // Security Audit Log (No Passwords or Patient PHI)
        _logger?.LogInformation(
            "SECURITY AUDIT: User '{Username}' registered with SERVER-ASSIGNED role '{RoleName}' (RoleId: {RoleId}) using invitation code '{InvitationCode}'. Client-submitted role preference was ignored.",
            user.Username, authorizedRole.Name, authorizedRole.RoleId, request.InvitationCode);

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    // WORKFLOW 1: FORGOT PASSWORD & SECURE TOKEN RESET
    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return true; // Return generic response
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailOrUsernameAsync(normalizedEmail, cancellationToken);

        // Return generic success regardless of whether account exists (Security standard against enumeration)
        if (user is null || !user.IsActive)
        {
            _logger?.LogInformation("FORGOT PASSWORD: Request received for non-existent or inactive email '{Email}'. Generic response returned.", normalizedEmail);
            return true;
        }

        // Generate secure 64-character raw token
        var rawToken = Guid.NewGuid().ToString("N") + RandomNumberGenerator.GetHexString(16);
        var tokenHash = _passwordHasher.HashPassword(rawToken);

        var resetToken = new PasswordResetToken
        {
            Email = normalizedEmail,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.SavePasswordResetTokenAsync(resetToken, cancellationToken);
        await _emailService.SendPasswordResetEmailAsync(user.Email, rawToken, cancellationToken);

        _logger?.LogInformation("FORGOT PASSWORD: Reset token generated and email dispatched to '{Email}'. Token expires in 30 minutes.", user.Email);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ArgumentException("Email, reset token, and new password are required.");
        }

        if (!request.NewPassword.Equals(request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match.");
        }

        if (request.NewPassword.Length < 6)
        {
            throw new ArgumentException("Password must be at least 6 characters long.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailOrUsernameAsync(normalizedEmail, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("Invalid or expired password reset request.");
        }

        // Search for active reset token
        var validTokens = await _userRepository.GetValidPasswordResetTokenAsync(normalizedEmail, _passwordHasher.HashPassword(request.Token), cancellationToken);
        if (validTokens is null)
        {
            // Fallback token comparison if hashed matching varies
            throw new InvalidOperationException("Invalid, expired, or already used password reset token.");
        }

        // Update password & invalidate refresh tokens
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _userRepository.MarkPasswordResetTokenAsUsedAsync(validTokens.PasswordResetTokenId, cancellationToken);

        _logger?.LogInformation("SECURITY AUDIT: Password reset successfully completed for user '{Email}'. Active refresh sessions revoked.", user.Email);
        return true;
    }

    // WORKFLOW 2: STAFF REGISTRATION -> PENDING APPROVAL -> ADMIN REVIEW
    public async Task<StaffRegistrationRequestDto> SubmitStaffRegistrationRequestAsync(SubmitStaffRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Username))
        {
            throw new ArgumentException("Required registration fields (Full Name, Email, Username) cannot be empty.");
        }

        if (!request.Password.Equals(request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();

        if (await _userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException($"An active account with email '{request.Email}' already exists in CareFlow HMS.");
        }

        if (await _userRepository.ExistsByUsernameAsync(normalizedUsername, cancellationToken))
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
        }

        if (await _userRepository.ExistsPendingStaffRequestByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException($"A pending staff registration request for '{request.Email}' is already awaiting administrator review.");
        }

        // Validate invitation code
        var invitation = await _userRepository.GetInvitationByCodeAsync(request.InvitationCode.Trim(), cancellationToken);
        if (invitation is null || invitation.IsUsed || invitation.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Valid, non-expired invitation code required for staff onboarding.");
        }

        var targetRole = invitation.TargetRole ?? await _userRepository.GetRoleByIdOrNameAsync(request.RequestedRoleId ?? invitation.TargetRoleId, null, cancellationToken);

        var staffReq = new StaffRegistrationRequest
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? null : request.EmployeeId.Trim(),
            DepartmentId = request.DepartmentId,
            RequestedRoleId = targetRole?.RoleId ?? invitation.TargetRoleId,
            InvitationCode = request.InvitationCode.Trim(),
            Status = RegistrationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddStaffRegistrationRequestAsync(staffReq, cancellationToken);

        // Send Email Notifications & Link to Request
        var emailLog = await _emailService.SendRegistrationConfirmationEmailAsync(staffReq.Email, staffReq.FullName, staffReq.StaffRegistrationRequestId, cancellationToken);
        await _emailService.SendAdminRegistrationAlertEmailAsync("admin@careflow.com", staffReq.FullName, targetRole?.Name ?? "Staff", staffReq.StaffRegistrationRequestId, cancellationToken);

        _logger?.LogInformation("STAFF REGISTRATION: Pending request #{Id} created for '{Email}' with requested role '{Role}'. Email Status: {EmailStatus}", staffReq.StaffRegistrationRequestId, staffReq.Email, targetRole?.Name, emailLog.Status);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<IEnumerable<StaffRegistrationRequestDto>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status, CancellationToken cancellationToken = default)
    {
        var requests = await _userRepository.GetStaffRegistrationRequestsAsync(status, cancellationToken);
        var dtos = new List<StaffRegistrationRequestDto>();

        foreach (var req in requests)
        {
            dtos.Add(await MapToStaffRequestDtoAsync(req, cancellationToken));
        }

        return dtos;
    }

    public async Task<StaffRegistrationRequestDto> ApproveStaffRegistrationRequestAsync(int requestId, int adminUserId, ApproveStaffRequest request, CancellationToken cancellationToken = default)
    {
        var staffReq = await _userRepository.GetStaffRegistrationRequestByIdAsync(requestId, cancellationToken);
        if (staffReq is null)
        {
            throw new KeyNotFoundException($"Staff registration request #{requestId} was not found.");
        }

        if (staffReq.Status != RegistrationStatus.Pending)
        {
            throw new InvalidOperationException($"Staff registration request #{requestId} has already been {staffReq.Status}.");
        }

        var adminUser = await _userRepository.GetByIdAsync(adminUserId, cancellationToken);
        if (adminUser is null)
        {
            throw new UnauthorizedAccessException("Reviewing administrator account not found.");
        }

        // Prevent self-approval
        if (staffReq.Email.Equals(adminUser.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Administrators are prohibited from approving their own staff registration requests.");
        }

        // Determine authorized role
        var targetRoleId = request.AuthorizedRoleId ?? staffReq.RequestedRoleId;
        var role = await _userRepository.GetRoleByIdOrNameAsync(targetRoleId, null, cancellationToken);
        if (role is null)
        {
            throw new InvalidOperationException("Authorized role could not be resolved.");
        }

        // Create active user account
        var newUser = new User
        {
            Username = staffReq.Username,
            Email = staffReq.Email,
            PasswordHash = staffReq.PasswordHash,
            FullName = staffReq.FullName,
            EmployeeId = staffReq.EmployeeId,
            RoleId = role.RoleId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(newUser, cancellationToken);

        // Update Staff Request Status
        staffReq.Status = RegistrationStatus.Approved;
        staffReq.ReviewedByUserId = adminUserId;
        staffReq.ReviewedAt = DateTime.UtcNow;

        await _userRepository.UpdateStaffRegistrationRequestAsync(staffReq, cancellationToken);

        // Send Approval Email
        var emailLog = await _emailService.SendStaffApprovalEmailAsync(staffReq.Email, staffReq.FullName, role.Name, staffReq.StaffRegistrationRequestId, cancellationToken);

        _logger?.LogInformation("ADMIN APPROVAL: Request #{Id} for '{Email}' APPROVED by Admin #{AdminId}. User account #{UserId} created with role '{Role}'. Email Status: {EmailStatus}",
            requestId, staffReq.Email, adminUserId, newUser.UserId, role.Name, emailLog.Status);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto> RejectStaffRegistrationRequestAsync(int requestId, int adminUserId, RejectStaffRequest request, CancellationToken cancellationToken = default)
    {
        var staffReq = await _userRepository.GetStaffRegistrationRequestByIdAsync(requestId, cancellationToken);
        if (staffReq is null)
        {
            throw new KeyNotFoundException($"Staff registration request #{requestId} was not found.");
        }

        if (staffReq.Status != RegistrationStatus.Pending)
        {
            throw new InvalidOperationException($"Staff registration request #{requestId} has already been {staffReq.Status}.");
        }

        var adminUser = await _userRepository.GetByIdAsync(adminUserId, cancellationToken);

        staffReq.Status = RegistrationStatus.Rejected;
        staffReq.RejectionReason = string.IsNullOrWhiteSpace(request.Reason) ? "Administrative policy non-compliance." : request.Reason.Trim();
        staffReq.ReviewedByUserId = adminUserId;
        staffReq.ReviewedAt = DateTime.UtcNow;

        await _userRepository.UpdateStaffRegistrationRequestAsync(staffReq, cancellationToken);

        // Send Rejection Email
        var emailLog = await _emailService.SendStaffRejectionEmailAsync(staffReq.Email, staffReq.FullName, staffReq.RejectionReason, staffReq.StaffRegistrationRequestId, cancellationToken);

        _logger?.LogInformation("ADMIN REJECTION: Request #{Id} for '{Email}' REJECTED by Admin #{AdminId}. Reason: {Reason}. Email Status: {EmailStatus}",
            requestId, staffReq.Email, adminUserId, staffReq.RejectionReason, emailLog.Status);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto> RetryStaffNotificationEmailAsync(int requestId, CancellationToken cancellationToken = default)
    {
        var staffReq = await _userRepository.GetStaffRegistrationRequestByIdAsync(requestId, cancellationToken);
        if (staffReq is null)
        {
            throw new KeyNotFoundException($"Staff registration request #{requestId} was not found.");
        }

        EmailLog emailLog;
        if (staffReq.Status == RegistrationStatus.Approved)
        {
            var roleName = staffReq.RequestedRole?.Name ?? "Staff";
            emailLog = await _emailService.SendStaffApprovalEmailAsync(staffReq.Email, staffReq.FullName, roleName, requestId, cancellationToken);
        }
        else if (staffReq.Status == RegistrationStatus.Rejected)
        {
            emailLog = await _emailService.SendStaffRejectionEmailAsync(staffReq.Email, staffReq.FullName, staffReq.RejectionReason ?? "Administrative review completed.", requestId, cancellationToken);
        }
        else
        {
            emailLog = await _emailService.SendRegistrationConfirmationEmailAsync(staffReq.Email, staffReq.FullName, requestId, cancellationToken);
        }

        _logger?.LogInformation("RETRY EMAIL: Dispatched notification retry for request #{Id} ({Email}). Outcome: {Status}", requestId, staffReq.Email, emailLog.Status);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto?> GetStaffRegistrationStatusAsync(string email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var request = await _userRepository.GetStaffRegistrationRequestByEmailAsync(email, cancellationToken);
        return request is null ? null : await MapToStaffRequestDtoAsync(request, cancellationToken);
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

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.Email) && !user.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.ExistsByEmailAsync(request.Email.Trim(), cancellationToken))
            {
                throw new InvalidOperationException($"Email '{request.Email}' is already in use by another account.");
            }
            user.Email = request.Email.Trim().ToLowerInvariant();
        }

        user.TimeFormat = request.TimeFormat;
        if (!string.IsNullOrWhiteSpace(request.TimeZone)) user.TimeZone = request.TimeZone.Trim();
        if (!string.IsNullOrWhiteSpace(request.Language)) user.Language = request.Language.Trim();

        await _userRepository.UpdateAsync(user, cancellationToken);
        return MapToUserDto(user);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password verification failed.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            throw new ArgumentException("New password must be at least 6 characters long.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _userRepository.UpdateAsync(user, cancellationToken);
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
            LastLoginAt = u.LastLoginAt,
            TimeFormat = u.TimeFormat,
            TimeZone = u.TimeZone ?? "UTC",
            Language = u.Language ?? "en-US"
        };
    }

    private async Task<StaffRegistrationRequestDto> MapToStaffRequestDtoAsync(StaffRegistrationRequest s, CancellationToken cancellationToken = default)
    {
        var dto = new StaffRegistrationRequestDto
        {
            Id = s.StaffRegistrationRequestId,
            FullName = s.FullName,
            Email = s.Email,
            Username = s.Username,
            EmployeeId = s.EmployeeId,
            DepartmentId = s.DepartmentId,
            DepartmentName = s.Department?.Name,
            RequestedRoleId = s.RequestedRoleId,
            RequestedRoleName = s.RequestedRole?.Name ?? "Staff",
            InvitationCode = s.InvitationCode,
            Status = s.Status,
            SubmittedAt = s.CreatedAt,
            ReviewedAt = s.ReviewedAt,
            ReviewedByName = s.ReviewedByUser?.FullName,
            RejectionReason = s.RejectionReason,
            EmailStatus = EmailDeliveryStatus.Sent
        };

        var emailLog = await _userRepository.GetLatestEmailLogForStaffRequestAsync(s.StaffRegistrationRequestId, cancellationToken);
        if (emailLog != null)
        {
            dto.EmailStatus = emailLog.Status;
            dto.LastEmailAttempt = emailLog.SentAt;
            dto.EmailErrorMessage = emailLog.ErrorMessage;
            dto.EmailLogId = emailLog.EmailLogId;
        }

        return dto;
    }

    // Direct Admin User Management Implementations
    public async Task<IEnumerable<AdminUserDto>> GetAllUsersForAdminAsync(string? search = null, int? roleId = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllUsersAsync(search, roleId, isActive, cancellationToken);
        return users.Select(MapToAdminUserDto);
    }

    public async Task<AdminUserDto> CreateUserByAdminAsync(CreateUserByAdminRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Full Name, Email, Username, and Password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();

        if (await _userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        if (await _userRepository.ExistsByUsernameAsync(normalizedUsername, cancellationToken))
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
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
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
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
            user.Role = null; // Detach stale navigation property so EF Core updates RoleId in SQL
        }

        user.EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? user.EmployeeId : request.EmployeeId.Trim();

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin updated details for user #{UserId} ('{Email}').", user.UserId, user.Email);

        var reloaded = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return MapToAdminUserDto(reloaded ?? user);
    }

    public async Task<AdminUserDto> UpdateUserRoleByAdminAsync(int userId, int roleId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
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
        user.Role = null; // Detach stale navigation property so EF Core updates RoleId in SQL

        await _userRepository.UpdateAsync(user, cancellationToken);
        _logger?.LogInformation("ADMIN ACTION: Admin changed role for user #{UserId} to '{Role}'.", user.UserId, role.Name);

        var reloaded = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return MapToAdminUserDto(reloaded ?? user);
    }

    public async Task<AdminUserDto> ToggleUserStatusByAdminAsync(int targetUserId, int currentAdminId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
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
        if (!isActive && user.Role != null && user.Role.Name == "Admin")
        {
            var activeAdminCount = await _userRepository.GetActiveAdminCountAsync(cancellationToken);
            if (activeAdminCount <= 1)
            {
                throw new InvalidOperationException("Cannot deactivate the last active administrator account in the system.");
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
        var user = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException($"User account #{targetUserId} not found.");
        }

        if (targetUserId == currentAdminId)
        {
            throw new InvalidOperationException("Administrators are prohibited from removing their own account.");
        }

        if (user.Role != null && user.Role.Name == "Admin")
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
            RoleId = u.RoleId,
            RoleName = u.Role?.Name ?? "Staff",
            RoleEnum = parsedRole,
            IsActive = u.IsActive,
            LastLoginAt = u.LastLoginAt,
            CreatedAt = u.CreatedAt
        };
    }
}
