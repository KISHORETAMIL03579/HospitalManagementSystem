using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Application.StaffRegistration.Services;

public class StaffRegistrationService : IStaffRegistrationService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly ILogger<StaffRegistrationService>? _logger;

    public StaffRegistrationService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        ILogger<StaffRegistrationService>? logger = null)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<StaffRegistrationRequestDto> SubmitStaffRegistrationRequestAsync(SubmitStaffRegistrationRequest request, CancellationToken cancellationToken = default)
    {
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

        if (await _userRepository.ExistsPendingStaffRequestByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException($"A registration request for email '{request.Email}' is already pending review.");
        }

        Role? targetRole = null;
        if (!string.IsNullOrWhiteSpace(request.InvitationCode))
        {
            var invitation = await _userRepository.GetInvitationByCodeAsync(request.InvitationCode, cancellationToken);
            if (invitation is null || invitation.IsUsed || invitation.ExpiresAt <= DateTime.UtcNow)
            {
                throw new InvalidOperationException("Invalid or expired invitation code.");
            }
            targetRole = invitation.TargetRole;
        }

        if (targetRole is null)
        {
            targetRole = await _userRepository.GetRoleByIdOrNameAsync(request.RequestedRoleId, null, cancellationToken);
            if (targetRole is null)
            {
                throw new InvalidOperationException("Invalid requested role specified.");
            }
        }

        // Security rule: Public registration cannot request Admin role without valid invitation
        if (targetRole.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(request.InvitationCode))
        {
            throw new InvalidOperationException("Registration for Administrative role requires a valid invitation code.");
        }

        var staffRequest = new StaffRegistrationRequest
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Username = normalizedUsername,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            RequestedRoleId = targetRole.RoleId,
            DepartmentId = request.DepartmentId,
            InvitationCode = request.InvitationCode?.Trim(),
            Status = RegistrationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _userRepository.AddStaffRegistrationRequestAsync(staffRequest, cancellationToken);
        _logger?.LogInformation("STAFF ONBOARDING: Submitted registration request #{Id} for '{Email}'", created.StaffRegistrationRequestId, created.Email);

        var emailLog = await _emailService.SendRegistrationConfirmationEmailAsync(created.Email, created.FullName, created.StaffRegistrationRequestId, cancellationToken);
        _logger?.LogInformation("STAFF ONBOARDING: Sent registration confirmation email for request #{Id}. Email status: {Status}", created.StaffRegistrationRequestId, emailLog.Status);

        return await MapToStaffRequestDtoAsync(created, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto?> GetStaffRegistrationStatusAsync(string email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var request = await _userRepository.GetStaffRegistrationRequestByEmailAsync(email, cancellationToken);
        return request is null ? null : await MapToStaffRequestDtoAsync(request, cancellationToken);
    }

    public async Task<IEnumerable<StaffRegistrationRequestDto>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status = null, CancellationToken cancellationToken = default)
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
            throw new KeyNotFoundException($"Staff registration request #{requestId} not found.");
        }

        // Idempotent check: If already approved, return current record without creating duplicate account
        if (staffReq.Status == RegistrationStatus.Approved)
        {
            return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
        }

        // Allow re-approving previously rejected requests
        if (staffReq.Status == RegistrationStatus.Rejected)
        {
            _logger?.LogInformation("STAFF APPROVAL: Re-evaluating previously rejected staff request #{Id} for approval.", requestId);
            staffReq.RejectionReason = null;
        }

        var assignedRoleId = request.AuthorizedRoleId.HasValue && request.AuthorizedRoleId.Value > 0 ? request.AuthorizedRoleId.Value : staffReq.RequestedRoleId;
        var role = await _userRepository.GetRoleByIdOrNameAsync(assignedRoleId, null, cancellationToken);
        if (role is null)
        {
            throw new InvalidOperationException("Invalid assigned role specified.");
        }

        staffReq.Status = RegistrationStatus.Approved;
        staffReq.ReviewedByUserId = adminUserId;
        staffReq.ReviewedAt = DateTime.UtcNow;
        staffReq.RequestedRoleId = assignedRoleId;
        staffReq.RequestedRole = null; // Clear navigation property to avoid EF Core entity graph conflicts

        await _userRepository.UpdateStaffRegistrationRequestAsync(staffReq, cancellationToken);

        // Provision active User account idempotently or activate existing
        var existingUser = await _userRepository.GetByEmailOrUsernameAsync(staffReq.Email, cancellationToken);
        if (existingUser is null)
        {
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
            _logger?.LogInformation("STAFF APPROVAL: Provisioned new active user account #{UserId} ('{Email}') with role '{Role}'", newUser.UserId, newUser.Email, role.Name);
        }
        else
        {
            existingUser.RoleId = role.RoleId;
            existingUser.IsActive = true;
            existingUser.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(existingUser, cancellationToken);
            _logger?.LogInformation("STAFF APPROVAL: Reactivated existing user account #{UserId} ('{Email}') with role '{Role}'", existingUser.UserId, existingUser.Email, role.Name);
        }

        var emailLog = await _emailService.SendStaffApprovalEmailAsync(staffReq.Email, staffReq.FullName, role.Name, requestId, cancellationToken);
        _logger?.LogInformation("STAFF APPROVAL: Dispatched approval email for request #{Id}. Email status: {Status}", requestId, emailLog.Status);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto> RejectStaffRegistrationRequestAsync(int requestId, int adminUserId, RejectStaffRequest request, CancellationToken cancellationToken = default)
    {
        var staffReq = await _userRepository.GetStaffRegistrationRequestByIdAsync(requestId, cancellationToken);
        if (staffReq is null)
        {
            throw new KeyNotFoundException($"Staff registration request #{requestId} not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 5)
        {
            throw new InvalidOperationException("Rejection reason is mandatory and must be at least 5 characters.");
        }

        // If previously approved, deactivate associated user account
        if (staffReq.Status == RegistrationStatus.Approved)
        {
            var user = await _userRepository.GetByEmailOrUsernameAsync(staffReq.Username, cancellationToken)
                ?? await _userRepository.GetByEmailOrUsernameAsync(staffReq.Email, cancellationToken);
            if (user != null)
            {
                user.IsActive = false;
                user.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user, cancellationToken);
                _logger?.LogInformation("STAFF REJECTION: Deactivated user account #{UserId} ('{Email}') following request rejection", user.UserId, user.Email);
            }
        }

        staffReq.Status = RegistrationStatus.Rejected;
        staffReq.ReviewedByUserId = adminUserId;
        staffReq.ReviewedAt = DateTime.UtcNow;
        staffReq.RejectionReason = request.Reason.Trim();
        staffReq.RequestedRole = null;

        await _userRepository.UpdateStaffRegistrationRequestAsync(staffReq, cancellationToken);

        var emailLog = await _emailService.SendStaffRejectionEmailAsync(staffReq.Email, staffReq.FullName, staffReq.RejectionReason, requestId, cancellationToken);
        _logger?.LogInformation("STAFF REJECTION: Dispatched rejection email for request #{Id}. Email status: {Status}", requestId, emailLog.Status);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto> UpdateStaffRegistrationRequestAsync(int requestId, int adminUserId, UpdateStaffRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        var staffReq = await _userRepository.GetStaffRegistrationRequestByIdAsync(requestId, cancellationToken);
        if (staffReq is null)
        {
            throw new KeyNotFoundException($"Staff registration request #{requestId} not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            staffReq.FullName = request.FullName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            staffReq.Email = request.Email.Trim().ToLowerInvariant();
        }

        if (request.EmployeeId != null)
        {
            staffReq.EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? null : request.EmployeeId.Trim();
        }

        if (request.RequestedRoleId.HasValue && request.RequestedRoleId.Value > 0)
        {
            staffReq.RequestedRoleId = request.RequestedRoleId.Value;
        }

        if (request.DepartmentId.HasValue)
        {
            staffReq.DepartmentId = request.DepartmentId.Value > 0 ? request.DepartmentId.Value : null;
        }

        if (request.RejectionReason != null)
        {
            staffReq.RejectionReason = request.RejectionReason.Trim();
        }

        // If status changed
        if (request.Status.HasValue)
        {
            var newStatus = (RegistrationStatus)request.Status.Value;
            var oldStatus = staffReq.Status;

            if (newStatus != oldStatus)
            {
                staffReq.Status = newStatus;
                staffReq.ReviewedByUserId = adminUserId;
                staffReq.ReviewedAt = DateTime.UtcNow;

                if (newStatus == RegistrationStatus.Approved)
                {
                    staffReq.RejectionReason = null;
                    var role = await _userRepository.GetRoleByIdOrNameAsync(staffReq.RequestedRoleId, null, cancellationToken)
                        ?? throw new InvalidOperationException($"Role #{staffReq.RequestedRoleId} not found.");

                    var existingUser = await _userRepository.GetByEmailOrUsernameAsync(staffReq.Username, cancellationToken)
                        ?? await _userRepository.GetByEmailOrUsernameAsync(staffReq.Email, cancellationToken);
                    if (existingUser is null)
                    {
                        var newUser = new User
                        {
                            FullName = staffReq.FullName,
                            Email = staffReq.Email,
                            Username = staffReq.Username,
                            PasswordHash = staffReq.PasswordHash,
                            RoleId = role.RoleId,
                            EmployeeId = staffReq.EmployeeId,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        await _userRepository.AddAsync(newUser, cancellationToken);
                    }
                    else
                    {
                        existingUser.FullName = staffReq.FullName;
                        existingUser.Email = staffReq.Email;
                        existingUser.RoleId = role.RoleId;
                        existingUser.EmployeeId = staffReq.EmployeeId;
                        existingUser.IsActive = true;
                        existingUser.UpdatedAt = DateTime.UtcNow;
                        await _userRepository.UpdateAsync(existingUser, cancellationToken);
                    }
                }
                else if (newStatus == RegistrationStatus.Rejected)
                {
                    if (string.IsNullOrWhiteSpace(request.RejectionReason) || request.RejectionReason.Trim().Length < 5)
                    {
                        throw new InvalidOperationException("Rejection reason is mandatory and must be at least 5 characters.");
                    }
                    staffReq.RejectionReason = request.RejectionReason.Trim();
                    var existingUser = await _userRepository.GetByEmailOrUsernameAsync(staffReq.Username, cancellationToken)
                        ?? await _userRepository.GetByEmailOrUsernameAsync(staffReq.Email, cancellationToken);
                    if (existingUser is not null)
                    {
                        existingUser.IsActive = false;
                        existingUser.UpdatedAt = DateTime.UtcNow;
                        await _userRepository.UpdateAsync(existingUser, cancellationToken);
                    }
                }
                else if (newStatus == RegistrationStatus.Pending)
                {
                    staffReq.RejectionReason = null;
                    staffReq.ReviewedAt = null;
                    staffReq.ReviewedByUserId = null;
                    var existingUser = await _userRepository.GetByEmailOrUsernameAsync(staffReq.Username, cancellationToken)
                        ?? await _userRepository.GetByEmailOrUsernameAsync(staffReq.Email, cancellationToken);
                    if (existingUser is not null)
                    {
                        existingUser.IsActive = false;
                        existingUser.UpdatedAt = DateTime.UtcNow;
                        await _userRepository.UpdateAsync(existingUser, cancellationToken);
                    }
                }
            }
        }

        // Sync user properties if user account already exists
        var userRecord = await _userRepository.GetByEmailOrUsernameAsync(staffReq.Username, cancellationToken)
            ?? await _userRepository.GetByEmailOrUsernameAsync(staffReq.Email, cancellationToken);
        if (userRecord != null && staffReq.Status == RegistrationStatus.Approved)
        {
            userRecord.FullName = staffReq.FullName;
            userRecord.Email = staffReq.Email;
            userRecord.RoleId = staffReq.RequestedRoleId;
            userRecord.EmployeeId = staffReq.EmployeeId;
            userRecord.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(userRecord, cancellationToken);
        }

        staffReq.RequestedRole = null;
        await _userRepository.UpdateStaffRegistrationRequestAsync(staffReq, cancellationToken);
        _logger?.LogInformation("STAFF UPDATE: Admin #{AdminId} updated staff request #{RequestId}", adminUserId, requestId);

        return await MapToStaffRequestDtoAsync(staffReq, cancellationToken);
    }

    public async Task<StaffRegistrationRequestDto> RetryStaffNotificationEmailAsync(int requestId, CancellationToken cancellationToken = default)
    {
        var staffReq = await _userRepository.GetStaffRegistrationRequestByIdAsync(requestId, cancellationToken);
        if (staffReq is null)
        {
            throw new KeyNotFoundException($"Staff registration request #{requestId} not found.");
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
}
