using HospitalManagement.Application.Patients.Interfaces;
using HospitalManagement.Infrastructure.Persistence;
using HospitalManagement.Infrastructure.Repositories;
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

        services.AddDbContext<HospitalDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IPatientRepository, PatientRepository>();

        return services;
    }
}

