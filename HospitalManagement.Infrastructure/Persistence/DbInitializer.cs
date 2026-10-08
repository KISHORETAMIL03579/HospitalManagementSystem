using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(HospitalDbContext context, IPasswordHasher passwordHasher, ILogger logger)
    {
        if (await context.Users.AnyAsync())
        {
            return; // Database already seeded
        }

        logger.LogInformation("Seeding initial Admin and Receptionist users...");

        var users = new[]
        {
            new User
            {
                Username = "admin",
                Email = "admin@careflow.com",
                FullName = "System Administrator",
                PasswordHash = passwordHasher.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Username = "reception",
                Email = "reception@careflow.com",
                FullName = "Receptionist User",
                PasswordHash = passwordHasher.HashPassword("Reception123!"),
                Role = UserRole.Receptionist,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();

        logger.LogInformation("User seeding completed successfully.");
    }
}
