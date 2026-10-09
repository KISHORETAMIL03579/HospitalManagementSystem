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

namespace HospitalManagement.Tests;

public class AuthorizationAuditTests
{
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<ILogger<AdminController>> _loggerMock;
    private readonly AdminController _adminController;

    public AuthorizationAuditTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _loggerMock = new Mock<ILogger<AdminController>>();
        _adminController = new AdminController(_authServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public void AdminController_MustHaveAuthorizeAttributeWithAdminRoles()
    {
        var authAttr = typeof(AdminController).GetCustomAttribute<AuthorizeAttribute>();
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
    public async Task AdminController_ApproveStaffRequest_WithoutUserIdClaim_ReturnsUnauthorized()
    {
        // Setup unauthenticated claims principal (no name identifier claim)
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        _adminController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var result = await _adminController.ApproveStaffRequest(1, new ApproveStaffRequest(), CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task AdminController_ApproveStaffRequest_WithValidAdminClaim_CallsAuthService()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "100"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _adminController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _authServiceMock.Setup(a => a.ApproveStaffRegistrationRequestAsync(1, 100, It.IsAny<ApproveStaffRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StaffRegistrationRequestDto { Id = 1, FullName = "Staff User" });

        var result = await _adminController.ApproveStaffRequest(1, new ApproveStaffRequest(), CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public void AuthController_PublicEndpoints_MustHaveAllowAnonymousAttribute()
    {
        var loginMethod = typeof(AuthController).GetMethod(nameof(AuthController.Login));
        var forgotMethod = typeof(AuthController).GetMethod(nameof(AuthController.ForgotPassword));
        var submitMethod = typeof(AuthController).GetMethod(nameof(AuthController.SubmitStaffRegistrationRequest));

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
