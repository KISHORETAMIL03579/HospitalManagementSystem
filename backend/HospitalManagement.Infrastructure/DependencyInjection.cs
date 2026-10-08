using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Application.Patients.Interfaces;
using HospitalManagement.Infrastructure.Persistence;
using HospitalManagement.Infrastructure.Repositories;
using HospitalManagement.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HospitalManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\MSSQLLocalDB;Database=HMS;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.Configure<JwtSettings>(options =>
        {
            var section = configuration.GetSection(JwtSettings.SectionName);
            if (section.Exists())
            {
                options.Secret = section["Secret"] ?? options.Secret;
                options.Issuer = section["Issuer"] ?? options.Issuer;
                options.Audience = section["Audience"] ?? options.Audience;
            }
        });

        services.AddDbContext<HospitalDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
