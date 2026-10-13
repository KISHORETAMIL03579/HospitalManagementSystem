using System.Reflection;
using System.Security.Claims;
using HospitalManagement.Api.Controllers;
using HospitalManagement.Application.Admin.Services;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Application.StaffRegistration.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class AuthorizationAuditTests
{
    private readonly Mock<IAdminUserService> _adminUserServiceMock;
    private readonly Mock<IStaffRegistrationService> _staffRegistrationServiceMock;
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<HospitalManagement.Application.Appointments.Services.IAppointmentService> _appointmentServiceMock;
    private readonly Mock<ILogger<AdminUsersController>> _adminUsersLoggerMock;
    private readonly Mock<ILogger<StaffRegistrationController>> _staffRegLoggerMock;
    private readonly Mock<ILogger<AuthController>> _authLoggerMock;
    private readonly Mock<ILogger<AppointmentsController>> _appointmentsLoggerMock;
    private readonly AdminUsersController _adminUsersController;
    private readonly StaffRegistrationController _staffRegistrationController;
    private readonly AuthController _authController;
    private readonly AppointmentsController _appointmentsController;

    public AuthorizationAuditTests()
    {
        _adminUserServiceMock = new Mock<IAdminUserService>();
        _staffRegistrationServiceMock = new Mock<IStaffRegistrationService>();
        _authServiceMock = new Mock<IAuthService>();
        _appointmentServiceMock = new Mock<HospitalManagement.Application.Appointments.Services.IAppointmentService>();
        _adminUsersLoggerMock = new Mock<ILogger<AdminUsersController>>();
        _staffRegLoggerMock = new Mock<ILogger<StaffRegistrationController>>();
        _authLoggerMock = new Mock<ILogger<AuthController>>();
        _appointmentsLoggerMock = new Mock<ILogger<AppointmentsController>>();
        _adminUsersController = new AdminUsersController(_adminUserServiceMock.Object, _adminUsersLoggerMock.Object);
        _staffRegistrationController = new StaffRegistrationController(_staffRegistrationServiceMock.Object, _staffRegLoggerMock.Object);
        _authController = new AuthController(_authServiceMock.Object, _authLoggerMock.Object);
        _appointmentsController = new AppointmentsController(_appointmentServiceMock.Object, _appointmentsLoggerMock.Object);
    }

    [Theory]
    [InlineData(typeof(AuthController), "api/v1/auth")]
    [InlineData(typeof(AdminUsersController), "api/v1/admin/users")]
    [InlineData(typeof(StaffRegistrationController), "api/v1/staff-registration")]
    [InlineData(typeof(DoctorsController), "api/v1/doctors")]
    [InlineData(typeof(AppointmentsController), "api/v1/appointments")]
    [InlineData(typeof(PatientsController), "api/v1/patients")]
    public void Controllers_MustUseStandardizedLowercaseRoutes(Type controllerType, string expectedRoute)
    {
        var routeAttr = controllerType.GetCustomAttribute<RouteAttribute>();
        Assert.NotNull(routeAttr);
        Assert.Equal(expectedRoute, routeAttr.Template);
    }

    [Fact]
    public void AdminUsersController_MustHaveAuthorizeAttributeWithAdminRoles()
    {
        var authAttr = typeof(AdminUsersController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
        Assert.NotNull(authAttr.Roles);
        Assert.Contains("Admin", authAttr.Roles);
        Assert.Contains("HospitalManager", authAttr.Roles);
    }

    [Fact]
    public void PatientsController_MustHaveAuthorizeAttributeAndRoleRestrictions()
    {
        var classAuthAttr = typeof(PatientsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(classAuthAttr);

        var getPatientsAuth = typeof(PatientsController).GetMethod(nameof(PatientsController.GetPatients))?.GetCustomAttribute<AuthorizeAttribute>();
        var createPatientAuth = typeof(PatientsController).GetMethod(nameof(PatientsController.CreatePatient))?.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(getPatientsAuth?.Roles);
        Assert.NotNull(createPatientAuth?.Roles);
        Assert.DoesNotContain("Patient", getPatientsAuth.Roles);
    }

    [Fact]
    public void DoctorsController_MustRestrictMutatingEndpoints()
    {
        var classAuthAttr = typeof(DoctorsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(classAuthAttr);

        var createDoctorAuth = typeof(DoctorsController).GetMethod(nameof(DoctorsController.CreateDoctor))?.GetCustomAttribute<AuthorizeAttribute>();
        var saveSchedulesAuth = typeof(DoctorsController).GetMethod(nameof(DoctorsController.SaveDoctorSchedules))?.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(createDoctorAuth?.Roles);
        Assert.Contains("Admin", createDoctorAuth.Roles);
        Assert.NotNull(saveSchedulesAuth?.Roles);
    }

    [Fact]
    public void AppointmentsController_MustSupportHttpPatchOnStatusUpdate()
    {
        var classAuthAttr = typeof(AppointmentsController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(classAuthAttr);

        var updateStatusMethod = typeof(AppointmentsController).GetMethod(nameof(AppointmentsController.UpdateAppointmentStatus));
        Assert.NotNull(updateStatusMethod);
        var patchAttr = updateStatusMethod.GetCustomAttribute<HttpPatchAttribute>();
        Assert.NotNull(patchAttr);
        Assert.Equal("{id:int}/status", patchAttr.Template);
    }

    [Fact]
    public async Task AppointmentsController_GetAppointments_PatientRole_ScopesToUserWithoutForbidden()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "5"),
            new Claim(ClaimTypes.Role, "Patient")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _appointmentsController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _appointmentServiceMock.Setup(s => s.GetAppointmentsForUserAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HospitalManagement.Application.Appointments.DTOs.AppointmentDto>
            {
                new HospitalManagement.Application.Appointments.DTOs.AppointmentDto
                {
                    AppointmentId = 10,
                    PatientName = "Patient John Smith",
                    DoctorName = "Dr. Sarah Jenkins"
                }
            });

        var result = await _appointmentsController.GetAppointments(null, null, null, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var appointments = Assert.IsAssignableFrom<IEnumerable<HospitalManagement.Application.Appointments.DTOs.AppointmentDto>>(okResult.Value);
        Assert.Single(appointments);
        _appointmentServiceMock.Verify(s => s.GetAppointmentsForUserAsync(5, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AppointmentsController_GetAppointmentById_PatientRole_OtherPatient_ReturnsForbidden()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "5"),
            new Claim(ClaimTypes.Role, "Patient")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _appointmentsController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _appointmentServiceMock.Setup(s => s.GetAppointmentByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HospitalManagement.Application.Appointments.DTOs.AppointmentDto
            {
                AppointmentId = 99,
                PatientId = 42 // Different patient
            });

        _appointmentServiceMock.Setup(s => s.GetPatientIdForUserAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1); // My patient ID is 1

        var result = await _appointmentsController.GetAppointmentById(99, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task AppointmentsController_UpdateStatus_PatientRole_CannotSetCompleted_ReturnsForbidden()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "5"),
            new Claim(ClaimTypes.Role, "Patient")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _appointmentsController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _appointmentServiceMock.Setup(s => s.GetAppointmentByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HospitalManagement.Application.Appointments.DTOs.AppointmentDto
            {
                AppointmentId = 10,
                PatientId = 1
            });

        _appointmentServiceMock.Setup(s => s.GetPatientIdForUserAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var request = new HospitalManagement.Application.Appointments.DTOs.UpdateAppointmentStatusRequest
        {
            Status = HospitalManagement.Domain.Enums.AppointmentStatus.Completed
        };

        var result = await _appointmentsController.UpdateAppointmentStatus(10, request, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task AppointmentsController_UpdateStatus_PatientRole_CanCancelOwnAppointment()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "5"),
            new Claim(ClaimTypes.Role, "Patient")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _appointmentsController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _appointmentServiceMock.Setup(s => s.GetAppointmentByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HospitalManagement.Application.Appointments.DTOs.AppointmentDto
            {
                AppointmentId = 10,
                PatientId = 1
            });

        _appointmentServiceMock.Setup(s => s.GetPatientIdForUserAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var request = new HospitalManagement.Application.Appointments.DTOs.UpdateAppointmentStatusRequest
        {
            Status = HospitalManagement.Domain.Enums.AppointmentStatus.Cancelled
        };

        var result = await _appointmentsController.UpdateAppointmentStatus(10, request, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        _appointmentServiceMock.Verify(s => s.UpdateStatusAsync(10, HospitalManagement.Domain.Enums.AppointmentStatus.Cancelled, null, It.IsAny<CancellationToken>()), Times.Once);
    }


    [Fact]
    public async Task StaffRegistrationController_ApproveStaffRequest_WithoutUserIdClaim_ReturnsUnauthorized()
    {
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
    public async Task AdminUsersController_HospitalManagerCreatingAdmin_ReturnsForbidden()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "8"),
            new Claim(ClaimTypes.Role, "HospitalManager")
        };
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        _adminUsersController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var result = await _adminUsersController.CreateUser(new CreateUserByAdminRequest { RoleId = 1, Username = "newadmin", Email = "admin2@hospital.com" }, CancellationToken.None);

        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, statusCodeResult.StatusCode);
    }

    [Fact]
    public async Task AuthController_GetRoles_AnonymousCaller_HidesAdminRole()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity());
        _authController.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _authServiceMock.Setup(s => s.GetRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RoleDto>
            {
                new RoleDto { RoleId = 1, Name = "Admin", Level = 100 },
                new RoleDto { RoleId = 3, Name = "Doctor", Level = 80 }
            });

        var result = await _authController.GetRoles(CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var roles = Assert.IsAssignableFrom<IEnumerable<RoleDto>>(okResult.Value);
        Assert.DoesNotContain(roles, r => r.Name == "Admin");
        Assert.Contains(roles, r => r.Name == "Doctor");
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
