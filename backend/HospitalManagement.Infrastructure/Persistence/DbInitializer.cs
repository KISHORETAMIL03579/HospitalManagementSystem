using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(HospitalDbContext context, IPasswordHasher passwordHasher, ILogger logger)
    {
        logger.LogInformation("Checking dynamic RBAC database seed status...");

        // 1. Seed Dynamic Roles if empty
        if (!await context.Roles.AnyAsync())
        {
            logger.LogInformation("Seeding dynamic Roles hierarchy...");

            var adminRole = new Role { Name = "Admin", Description = "System Super Administrator with full operational access", Level = 100 };
            await context.Roles.AddAsync(adminRole);
            await context.SaveChangesAsync();

            var managerRole = new Role { Name = "HospitalManager", Description = "Hospital Operations Manager", Level = 90, ParentRoleId = adminRole.RoleId };
            var receptionistRole = new Role { Name = "Receptionist", Description = "Patient Intake & Front Desk Scheduling", Level = 40, ParentRoleId = adminRole.RoleId };
            await context.Roles.AddRangeAsync(managerRole, receptionistRole);
            await context.SaveChangesAsync();

            var doctorRole = new Role { Name = "Doctor", Description = "Attending Physician & Specialist", Level = 80, ParentRoleId = managerRole.RoleId };
            var pharmacistRole = new Role { Name = "Pharmacist", Description = "Pharmacy & Medication Dispensing Manager", Level = 70, ParentRoleId = managerRole.RoleId };
            var labTechRole = new Role { Name = "LabTechnician", Description = "Laboratory Technician & Diagnostics Specialist", Level = 70, ParentRoleId = managerRole.RoleId };
            var patientRole = new Role { Name = "Patient", Description = "Registered Patient", Level = 20, ParentRoleId = receptionistRole.RoleId };
            await context.Roles.AddRangeAsync(doctorRole, pharmacistRole, labTechRole, patientRole);
            await context.SaveChangesAsync();

            var nurseRole = new Role { Name = "Nurse", Description = "Clinical Care Nurse", Level = 60, ParentRoleId = doctorRole.RoleId };
            await context.Roles.AddAsync(nurseRole);
            await context.SaveChangesAsync();

            logger.LogInformation("Dynamic Roles seeded successfully.");
        }

        // 2. Seed Granular Permissions if empty
        if (!await context.Permissions.AnyAsync())
        {
            logger.LogInformation("Seeding granular System Permissions...");

            var permList = new[]
            {
                new Permission { Name = Permissions.ManageUsers, Category = "Administration", Description = "Create and manage system user accounts" },
                new Permission { Name = Permissions.ManageSystem, Category = "Administration", Description = "System configuration and maintenance" },
                new Permission { Name = Permissions.ViewPatient, Category = "Patients", Description = "View patient records and demographics" },
                new Permission { Name = Permissions.RegisterPatient, Category = "Patients", Description = "Register new patient records" },
                new Permission { Name = Permissions.ViewOwnProfile, Category = "Patients", Description = "View personal patient profile" },
                new Permission { Name = Permissions.CreateEncounter, Category = "Clinical", Description = "Create medical encounters and diagnostic notes" },
                new Permission { Name = Permissions.CreatePrescription, Category = "Clinical", Description = "Prescribe medications" },
                new Permission { Name = Permissions.ViewLabResult, Category = "Clinical", Description = "View patient lab results" },
                new Permission { Name = Permissions.EnterLabResult, Category = "Laboratory", Description = "Enter and certify lab diagnostic results" },
                new Permission { Name = Permissions.RecordVitals, Category = "Clinical", Description = "Record patient vital signs" },
                new Permission { Name = Permissions.CreateAppointment, Category = "Scheduling", Description = "Schedule doctor consultations" },
                new Permission { Name = Permissions.ViewAppointment, Category = "Scheduling", Description = "View appointment schedules" },
                new Permission { Name = Permissions.CheckInPatient, Category = "Scheduling", Description = "Check in patients for visits" },
                new Permission { Name = Permissions.DispenseMedication, Category = "Pharmacy", Description = "Fulfill and dispense prescriptions" },
                new Permission { Name = Permissions.ViewOwnAppointments, Category = "Patients", Description = "View personal appointments" },
                new Permission { Name = Permissions.ViewOwnLabResults, Category = "Patients", Description = "View personal lab diagnostic reports" }
            };

            await context.Permissions.AddRangeAsync(permList);
            await context.SaveChangesAsync();

            // Assign Permissions to Roles
            var roles = await context.Roles.ToListAsync();
            var perms = await context.Permissions.ToDictionaryAsync(p => p.Name);

            var admin = roles.First(r => r.Name == "Admin");
            var doctor = roles.First(r => r.Name == "Doctor");
            var nurse = roles.First(r => r.Name == "Nurse");
            var receptionist = roles.First(r => r.Name == "Receptionist");
            var patient = roles.First(r => r.Name == "Patient");
            var pharmacist = roles.First(r => r.Name == "Pharmacist");
            var labTech = roles.First(r => r.Name == "LabTechnician");

            var rolePerms = new List<RolePermission>();

            // Admin gets all permissions
            foreach (var p in perms.Values)
            {
                rolePerms.Add(new RolePermission { RoleId = admin.RoleId, PermissionId = p.PermissionId });
            }

            // Doctor
            foreach (var name in new[] { Permissions.ViewPatient, Permissions.CreateEncounter, Permissions.CreatePrescription, Permissions.ViewLabResult, Permissions.ViewAppointment, Permissions.RecordVitals })
            {
                if (perms.TryGetValue(name, out var p)) rolePerms.Add(new RolePermission { RoleId = doctor.RoleId, PermissionId = p.PermissionId });
            }

            // Nurse
            foreach (var name in new[] { Permissions.ViewPatient, Permissions.RecordVitals, Permissions.ViewAppointment, Permissions.ViewLabResult })
            {
                if (perms.TryGetValue(name, out var p)) rolePerms.Add(new RolePermission { RoleId = nurse.RoleId, PermissionId = p.PermissionId });
            }

            // Receptionist
            foreach (var name in new[] { Permissions.RegisterPatient, Permissions.CreateAppointment, Permissions.ViewAppointment, Permissions.CheckInPatient, Permissions.ViewPatient })
            {
                if (perms.TryGetValue(name, out var p)) rolePerms.Add(new RolePermission { RoleId = receptionist.RoleId, PermissionId = p.PermissionId });
            }

            // Patient
            foreach (var name in new[] { Permissions.ViewOwnProfile, Permissions.ViewOwnAppointments, Permissions.ViewOwnLabResults })
            {
                if (perms.TryGetValue(name, out var p)) rolePerms.Add(new RolePermission { RoleId = patient.RoleId, PermissionId = p.PermissionId });
            }

            // Pharmacist
            foreach (var name in new[] { Permissions.ViewPatient, Permissions.DispenseMedication, Permissions.ViewLabResult })
            {
                if (perms.TryGetValue(name, out var p)) rolePerms.Add(new RolePermission { RoleId = pharmacist.RoleId, PermissionId = p.PermissionId });
            }

            // LabTechnician
            foreach (var name in new[] { Permissions.ViewPatient, Permissions.EnterLabResult, Permissions.ViewLabResult })
            {
                if (perms.TryGetValue(name, out var p)) rolePerms.Add(new RolePermission { RoleId = labTech.RoleId, PermissionId = p.PermissionId });
            }

            await context.RolePermissions.AddRangeAsync(rolePerms);
            await context.SaveChangesAsync();
            logger.LogInformation("RolePermissions mapped successfully.");
        }

        // 3. Seed User Accounts if empty
        if (!await context.Users.AnyAsync())
        {
            logger.LogInformation("Seeding user accounts for all dynamic roles...");

            var roles = await context.Roles.ToDictionaryAsync(r => r.Name);

            var users = new[]
            {
                new User
                {
                    Username = "admin",
                    Email = "admin@careflow.com",
                    FullName = "System Administrator",
                    PasswordHash = passwordHasher.HashPassword("Admin123!"),
                    RoleId = roles["Admin"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new User
                {
                    Username = "doctor",
                    Email = "doctor@careflow.com",
                    FullName = "Dr. Eleanor Vance",
                    PasswordHash = passwordHasher.HashPassword("Doctor123!"),
                    RoleId = roles["Doctor"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new User
                {
                    Username = "nurse",
                    Email = "nurse@careflow.com",
                    FullName = "Nurse Clara Barton",
                    PasswordHash = passwordHasher.HashPassword("Nurse123!"),
                    RoleId = roles["Nurse"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new User
                {
                    Username = "reception",
                    Email = "reception@careflow.com",
                    FullName = "Receptionist Staff",
                    PasswordHash = passwordHasher.HashPassword("Reception123!"),
                    RoleId = roles["Receptionist"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new User
                {
                    Username = "patient",
                    Email = "patient@careflow.com",
                    FullName = "Patient John Smith",
                    PasswordHash = passwordHasher.HashPassword("Patient123!"),
                    RoleId = roles["Patient"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new User
                {
                    Username = "pharmacist",
                    Email = "pharmacist@careflow.com",
                    FullName = "Pharm. Robert Ford",
                    PasswordHash = passwordHasher.HashPassword("Pharma123!"),
                    RoleId = roles["Pharmacist"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new User
                {
                    Username = "labtech",
                    Email = "labtech@careflow.com",
                    FullName = "Tech. Marie Curie",
                    PasswordHash = passwordHasher.HashPassword("LabTech123!"),
                    RoleId = roles["LabTechnician"].RoleId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
            logger.LogInformation("Dynamic User seeding completed successfully.");
        }

        // 4. Seed Departments & Doctors if empty
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
