using HospitalManagement.Application.Appointments.Interfaces;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Application.Doctors.Interfaces;
using HospitalManagement.Application.Patients.Interfaces;
using HospitalManagement.Infrastructure.Persistence;
using HospitalManagement.Infrastructure.Repositories;
using HospitalManagement.Infrastructure.Security;
using HospitalManagement.Infrastructure.Services;
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

        services.Configure<SmtpSettings>(options =>
        {
            var section = configuration.GetSection("SmtpSettings");
            if (section.Exists())
            {
                options.Server = section["Server"] ?? options.Server;
                if (int.TryParse(section["Port"], out var port)) options.Port = port;
                options.SenderName = section["SenderName"] ?? options.SenderName;
                options.SenderEmail = section["SenderEmail"] ?? options.SenderEmail;
                options.Username = section["Username"] ?? options.Username;
                options.Password = section["Password"] ?? options.Password;
                if (bool.TryParse(section["EnableSsl"], out var ssl)) options.EnableSsl = ssl;
                if (bool.TryParse(section["EnableRealDelivery"], out var realDelivery)) options.EnableRealDelivery = realDelivery;
            }
        });

        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}
