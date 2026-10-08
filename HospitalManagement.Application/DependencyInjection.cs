using FluentValidation;
using HospitalManagement.Application.Patients.Services;
using Microsoft.Extensions.DependencyInjection;

namespace HospitalManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddValidatorsFromAssembly(assembly);
        services.AddScoped<IPatientService, PatientService>();

        return services;
    }
}

