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
        logger.LogInformation("Checking database seed status...");

        if (!await context.Users.AnyAsync())
        {
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

        if (!await context.Departments.AnyAsync())
        {
            logger.LogInformation("Seeding initial Departments and Doctors...");

            var cardiology = new Department { Name = "Cardiology", Description = "Heart & Cardiovascular Care", CreatedAt = DateTime.UtcNow };
            var neurology = new Department { Name = "Neurology", Description = "Brain & Nervous System Care", CreatedAt = DateTime.UtcNow };
            var orthopedics = new Department { Name = "Orthopedics", Description = "Bones, Joints & Musculoskeletal System", CreatedAt = DateTime.UtcNow };
            var pediatrics = new Department { Name = "Pediatrics", Description = "Child and Adolescent Care", CreatedAt = DateTime.UtcNow };

            await context.Departments.AddRangeAsync(cardiology, neurology, orthopedics, pediatrics);
            await context.SaveChangesAsync();

            var doctors = new[]
            {
                new Doctor
                {
                    LicenseNumber = "DOC-1001",
                    FirstName = "Eleanor",
                    LastName = "Vance",
                    Specialization = "Cardiologist",
                    Email = "dr.vance@careflow.com",
                    Phone = "+1 (555) 234-5678",
                    DepartmentId = cardiology.DepartmentId,
                    ConsultationFee = 150.00m,
                    CreatedAt = DateTime.UtcNow
                },
                new Doctor
                {
                    LicenseNumber = "DOC-1002",
                    FirstName = "Marcus",
                    LastName = "Brody",
                    Specialization = "Neurologist",
                    Email = "dr.brody@careflow.com",
                    Phone = "+1 (555) 876-5432",
                    DepartmentId = neurology.DepartmentId,
                    ConsultationFee = 180.00m,
                    CreatedAt = DateTime.UtcNow
                },
                new Doctor
                {
                    LicenseNumber = "DOC-1003",
                    FirstName = "Sarah",
                    LastName = "Connor",
                    Specialization = "Orthopedic Surgeon",
                    Email = "dr.connor@careflow.com",
                    Phone = "+1 (555) 345-6789",
                    DepartmentId = orthopedics.DepartmentId,
                    ConsultationFee = 200.00m,
                    CreatedAt = DateTime.UtcNow
                },
                new Doctor
                {
                    LicenseNumber = "DOC-1004",
                    FirstName = "Julian",
                    LastName = "Bashir",
                    Specialization = "Pediatrician",
                    Email = "dr.bashir@careflow.com",
                    Phone = "+1 (555) 987-6543",
                    DepartmentId = pediatrics.DepartmentId,
                    ConsultationFee = 120.00m,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Doctors.AddRangeAsync(doctors);
            await context.SaveChangesAsync();
            logger.LogInformation("Department and Doctor seeding completed successfully.");
        }
    }
}

