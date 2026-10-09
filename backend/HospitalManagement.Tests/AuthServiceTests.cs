using FluentValidation;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Application.Auth.Validators;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using HospitalManagement.Infrastructure.Security;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly PasswordHasher _passwordHasher;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly LoginRequestValidator _loginValidator;
    private readonly RegisterUserRequestValidator _registerValidator;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _emailServiceMock = new Mock<IEmailService>();
        _passwordHasher = new PasswordHasher();

        var jwtSettingsOptions = Options.Create(new JwtSettings
        {
            Secret = "CareFlow_Super_Secret_JWT_Signing_Key_2026_Minimum_32_Bytes!",
            Issuer = "CareFlowHMS",
            Audience = "CareFlowHMSClient",
            ExpiryMinutes = 120
        });

        _jwtTokenGenerator = new JwtTokenGenerator(jwtSettingsOptions);
        _loginValidator = new LoginRequestValidator();
        _registerValidator = new RegisterUserRequestValidator();

        _authService = new AuthService(
            _userRepositoryMock.Object,
            _passwordHasher,
            _jwtTokenGenerator,
            _emailServiceMock.Object,
            _loginValidator,
            _registerValidator);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnJwtTokenAndUserDto()
    {
        // Arrange
        var passwordHash = _passwordHasher.HashPassword("Admin123!");
        var user = new User
        {
            UserId = 1,
            Username = "admin",
            Email = "admin@careflow.com",
            PasswordHash = passwordHash,
            FullName = "System Administrator",
            RoleId = 1,
            Role = new Role { RoleId = 1, Name = "Admin", Level = 100 },
            IsActive = true
        };

        _userRepositoryMock.Setup(r => r.GetByEmailOrUsernameAsync("admin@careflow.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest
        {
            UsernameOrEmail = "admin@careflow.com",
            Password = "Admin123!"
        };

        // Act
        var response = await _authService.LoginAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal("admin@careflow.com", response.User.Email);
        Assert.Equal(UserRole.Admin, response.User.Role);
        _userRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var passwordHash = _passwordHasher.HashPassword("Admin123!");
        var user = new User
        {
            UserId = 1,
            Username = "admin",
            Email = "admin@careflow.com",
            PasswordHash = passwordHash,
            IsActive = true
        };

        _userRepositoryMock.Setup(r => r.GetByEmailOrUsernameAsync("admin@careflow.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest
        {
            UsernameOrEmail = "admin@careflow.com",
            Password = "WrongPassword!"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authService.LoginAsync(request));
    }

    [Fact]
    public async Task RegisterAsync_WithEmptyRequiredFields_ShouldThrowValidationException()
    {
        var request = new RegisterUserRequest();

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(request));
        Assert.NotEmpty(ex.Errors);
    }

    [Fact]
    public async Task RegisterAsync_WithInvalidEmail_ShouldThrowValidationException()
    {
        var request = new RegisterUserRequest
        {
            Username = "johndoe",
            Email = "not-an-email",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FullName = "John Doe",
            InvitationCode = "RECEPT-MAIN"
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(request));
        Assert.Contains(ex.Errors, e => e.PropertyName == "Email");
    }

    [Fact]
    public async Task RegisterAsync_WithPasswordMismatch_ShouldThrowValidationException()
    {
        var request = new RegisterUserRequest
        {
            Username = "johndoe",
            Email = "john@hospital.com",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword456!",
            FullName = "John Doe",
            InvitationCode = "RECEPT-MAIN"
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _authService.RegisterAsync(request));
        Assert.Contains(ex.Errors, e => e.PropertyName == "ConfirmPassword" && e.ErrorMessage.Contains("do not match"));
    }

    [Fact]
    public async Task RegisterAsync_WithMissingOrInvalidInvitation_ShouldThrowInvalidOperationException()
    {
        var request = new RegisterUserRequest
        {
            Username = "johndoe",
            Email = "john@hospital.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FullName = "John Doe",
            InvitationCode = "INVALID-CODE-XYZ"
        };

        _userRepositoryMock.Setup(r => r.GetInvitationByCodeAsync("INVALID-CODE-XYZ", It.IsAny<CancellationToken>()))
            .ReturnsAsync((InvitationCode?)null);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _authService.RegisterAsync(request));
        Assert.Contains("Invalid or unrecognized invitation code", ex.Message);
    }

    [Fact]
    public async Task RegisterAsync_WithExpiredInvitation_ShouldThrowInvalidOperationException()
    {
        var request = new RegisterUserRequest
        {
            Username = "johndoe",
            Email = "john@hospital.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FullName = "John Doe",
            InvitationCode = "EXPIRED-2025"
        };

        var expiredInvitation = new InvitationCode
        {
            Code = "EXPIRED-2025",
            ExpiresAt = DateTime.UtcNow.AddDays(-5),
            IsUsed = false
        };

        _userRepositoryMock.Setup(r => r.GetInvitationByCodeAsync("EXPIRED-2025", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expiredInvitation);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _authService.RegisterAsync(request));
        Assert.Contains("expired", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RegisterAsync_WithReusedInvitation_ShouldThrowInvalidOperationException()
    {
        var request = new RegisterUserRequest
        {
            Username = "johndoe",
            Email = "john@hospital.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FullName = "John Doe",
            InvitationCode = "USED-CODE-999"
        };

        var usedInvitation = new InvitationCode
        {
            Code = "USED-CODE-999",
            ExpiresAt = DateTime.UtcNow.AddDays(10),
            IsUsed = true,
            UsedAt = DateTime.UtcNow.AddDays(-1)
        };

        _userRepositoryMock.Setup(r => r.GetInvitationByCodeAsync("USED-CODE-999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(usedInvitation);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _authService.RegisterAsync(request));
        Assert.Contains("already been used", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RegisterAsync_WhenClientSendsAdminRole_ShouldIgnoreClientRoleAndAssignInvitationRole()
    {
        var request = new RegisterUserRequest
        {
            Username = "newreceptionist",
            Email = "receptionist@hospital.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FullName = "Clara Reception",
            InvitationCode = "RECEPT-MAIN",
            Role = UserRole.Admin // MALICIOUS CLIENT ATTACK
        };

        var receptionistRole = new Role
        {
            RoleId = 4,
            Name = "Receptionist",
            Level = 40
        };

        var validInvitation = new InvitationCode
        {
            InvitationCodeId = 10,
            Code = "RECEPT-MAIN",
            TargetRoleId = 4,
            TargetRole = receptionistRole,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            IsUsed = false
        };

        _userRepositoryMock.Setup(r => r.GetInvitationByCodeAsync("RECEPT-MAIN", It.IsAny<CancellationToken>()))
            .ReturnsAsync(validInvitation);

        User? capturedUser = null;
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, ct) => capturedUser = u)
            .ReturnsAsync((User u, CancellationToken ct) => u);

        var response = await _authService.RegisterAsync(request);

        Assert.NotNull(response);
        Assert.NotNull(capturedUser);
        Assert.Equal(4, capturedUser.RoleId);
        Assert.Equal("Receptionist", capturedUser.Role.Name);
        Assert.Equal(UserRole.Receptionist, response.User.Role);
        _userRepositoryMock.Verify(r => r.MarkInvitationAsUsedAsync(10, It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithExistingUser_ShouldSaveTokenAndDispatchEmail()
    {
        var user = new User
        {
            UserId = 1,
            Email = "doctor@careflow.com",
            IsActive = true
        };

        _userRepositoryMock.Setup(r => r.GetByEmailOrUsernameAsync("doctor@careflow.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var result = await _authService.ForgotPasswordAsync(new ForgotPasswordRequest { Email = "doctor@careflow.com" });

        Assert.True(result);
        _userRepositoryMock.Verify(r => r.SavePasswordResetTokenAsync(It.IsAny<PasswordResetToken>(), It.IsAny<CancellationToken>()), Times.Once);
        _emailServiceMock.Verify(e => e.SendPasswordResetEmailAsync("doctor@careflow.com", It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithNonExistentUser_ShouldReturnGenericTrueWithoutError()
    {
        _userRepositoryMock.Setup(r => r.GetByEmailOrUsernameAsync("nonexistent@careflow.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await _authService.ForgotPasswordAsync(new ForgotPasswordRequest { Email = "nonexistent@careflow.com" });

        Assert.True(result);
        _userRepositoryMock.Verify(r => r.SavePasswordResetTokenAsync(It.IsAny<PasswordResetToken>(), It.IsAny<CancellationToken>()), Times.Never);
        _emailServiceMock.Verify(e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SubmitStaffRegistrationRequestAsync_WithValidData_ShouldCreatePendingRequest()
    {
        var request = new SubmitStaffRegistrationRequest
        {
            FullName = "Dr. Sarah Jenkins",
            Email = "sarah.jenkins@hospital.com",
            Username = "sjenkins",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            EmployeeId = "EMP-00125",
            InvitationCode = "DOC-CARDIO"
        };

        var docRole = new Role { RoleId = 2, Name = "Doctor", Level = 80 };
        var validInvitation = new InvitationCode { InvitationCodeId = 5, Code = "DOC-CARDIO", TargetRoleId = 2, TargetRole = docRole, ExpiresAt = DateTime.UtcNow.AddDays(10), IsUsed = false };

        _userRepositoryMock.Setup(r => r.GetInvitationByCodeAsync("DOC-CARDIO", It.IsAny<CancellationToken>())).ReturnsAsync(validInvitation);

        StaffRegistrationRequest? capturedReq = null;
        _userRepositoryMock.Setup(r => r.AddStaffRegistrationRequestAsync(It.IsAny<StaffRegistrationRequest>(), It.IsAny<CancellationToken>()))
            .Callback<StaffRegistrationRequest, CancellationToken>((s, ct) => capturedReq = s)
            .ReturnsAsync((StaffRegistrationRequest s, CancellationToken ct) => s);

        var result = await _authService.SubmitStaffRegistrationRequestAsync(request);

        Assert.NotNull(result);
        Assert.NotNull(capturedReq);
        Assert.Equal(RegistrationStatus.Pending, capturedReq.Status);
        Assert.Equal("sarah.jenkins@hospital.com", capturedReq.Email);
        _emailServiceMock.Verify(e => e.SendRegistrationConfirmationEmailAsync("sarah.jenkins@hospital.com", "Dr. Sarah Jenkins", It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ApproveStaffRegistrationRequestAsync_WhenAdminApprovesSelf_ShouldThrowInvalidOperationException()
    {
        var pendingReq = new StaffRegistrationRequest
        {
            StaffRegistrationRequestId = 10,
            Email = "admin@careflow.com",
            FullName = "Admin User",
            Status = RegistrationStatus.Pending
        };

        var adminUser = new User
        {
            UserId = 1,
            Email = "admin@careflow.com", // SAME EMAIL -> SELF APPROVAL!
            IsActive = true
        };

        _userRepositoryMock.Setup(r => r.GetStaffRegistrationRequestByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(pendingReq);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(adminUser);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _authService.ApproveStaffRegistrationRequestAsync(10, 1, new ApproveStaffRequest()));

        Assert.Contains("prohibited from approving their own", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}
