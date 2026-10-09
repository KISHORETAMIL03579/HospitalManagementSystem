using FluentValidation;
using HospitalManagement.Application.Admin.Services;
using HospitalManagement.Application.Appointments.Services;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Application.Doctors.Services;
using HospitalManagement.Application.Patients.Services;
using HospitalManagement.Application.StaffRegistration.Services;
using Microsoft.Extensions.DependencyInjection;

namespace HospitalManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddValidatorsFromAssembly(assembly);
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IStaffRegistrationService, StaffRegistrationService>();
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IAppointmentService, AppointmentService>();

        return services;
    }
}
