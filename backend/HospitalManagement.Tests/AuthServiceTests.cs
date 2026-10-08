using FluentValidation;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Application.Auth.Validators;
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
    private readonly PasswordHasher _passwordHasher;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly LoginRequestValidator _loginValidator;
    private readonly RegisterUserRequestValidator _registerValidator;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
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
}
