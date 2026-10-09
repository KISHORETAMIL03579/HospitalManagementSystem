using System.Reflection;
using System.Security.Claims;
using HospitalManagement.Api.Controllers;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

using HospitalManagement.Application.Admin.Services;
using HospitalManagement.Application.StaffRegistration.Services;

namespace HospitalManagement.Tests;

public class AuthorizationAuditTests
{
    private readonly Mock<IAdminUserService> _adminUserServiceMock;
    private readonly Mock<IStaffRegistrationService> _staffRegistrationServiceMock;
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<ILogger<AdminUsersController>> _adminUsersLoggerMock;
    private readonly Mock<ILogger<StaffRegistrationController>> _staffRegLoggerMock;
    private readonly AdminUsersController _adminUsersController;
    private readonly StaffRegistrationController _staffRegistrationController;

    public AuthorizationAuditTests()
    {
        _adminUserServiceMock = new Mock<IAdminUserService>();
        _staffRegistrationServiceMock = new Mock<IStaffRegistrationService>();
        _authServiceMock = new Mock<IAuthService>();
        _adminUsersLoggerMock = new Mock<ILogger<AdminUsersController>>();
        _staffRegLoggerMock = new Mock<ILogger<StaffRegistrationController>>();
        _adminUsersController = new AdminUsersController(_adminUserServiceMock.Object, _adminUsersLoggerMock.Object);
        _staffRegistrationController = new StaffRegistrationController(_staffRegistrationServiceMock.Object, _staffRegLoggerMock.Object);
    }

    [Fact]
    public void AdminUsersController_MustHaveAuthorizeAttributeWithAdminRoles()
    {
        var authAttr = typeof(AdminUsersController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
        Assert.NotNull(authAttr.Roles);
        Assert.Contains("Admin", authAttr.Roles);
    }

    [Fact]
    public void PatientsController_MustHaveAuthorizeAttribute()
    {
        var authAttr = typeof(PatientsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
    }

    [Fact]
    public void DoctorsController_MustHaveAuthorizeAttribute()
    {
        var authAttr = typeof(DoctorsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
    }

    [Fact]
    public void AppointmentsController_MustHaveAuthorizeAttribute()
    {
        var authAttr = typeof(AppointmentsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
    }

    [Fact]
    public async Task StaffRegistrationController_ApproveStaffRequest_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Setup unauthenticated claims principal (no name identifier claim)
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        _staffRegistrationController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var result = await _staffRegistrationController.ApproveStaffRequest(1, new ApproveStaffRequest(), CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task StaffRegistrationController_ApproveStaffRequest_WithValidAdminClaim_CallsAuthService()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "100"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _staffRegistrationController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _staffRegistrationServiceMock.Setup(a => a.ApproveStaffRegistrationRequestAsync(1, 100, It.IsAny<ApproveStaffRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StaffRegistrationRequestDto { Id = 1, FullName = "Staff User" });

        var result = await _staffRegistrationController.ApproveStaffRequest(1, new ApproveStaffRequest(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void AuthController_PublicEndpoints_MustHaveAllowAnonymousAttribute()
    {
        var loginMethod = typeof(AuthController).GetMethod(nameof(AuthController.Login));
        var forgotMethod = typeof(AuthController).GetMethod(nameof(AuthController.ForgotPassword));
        var submitMethod = typeof(StaffRegistrationController).GetMethod(nameof(StaffRegistrationController.SubmitStaffRegistrationRequest));

        Assert.NotNull(loginMethod?.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.NotNull(forgotMethod?.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.NotNull(submitMethod?.GetCustomAttribute<AllowAnonymousAttribute>());
    }

    [Fact]
    public void AuthController_ProtectedEndpoints_MustHaveAuthorizeAttribute()
    {
        var meMethod = typeof(AuthController).GetMethod(nameof(AuthController.GetCurrentUser));
        var profileMethod = typeof(AuthController).GetMethod(nameof(AuthController.UpdateProfile));
        var passMethod = typeof(AuthController).GetMethod(nameof(AuthController.ChangePassword));

        Assert.NotNull(meMethod?.GetCustomAttribute<AuthorizeAttribute>());
        Assert.NotNull(profileMethod?.GetCustomAttribute<AuthorizeAttribute>());
        Assert.NotNull(passMethod?.GetCustomAttribute<AuthorizeAttribute>());
    }
}
