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
        logger.LogInformation("Checking dynamic RBAC database schema and seed status...");

        // Ensure newly added schema columns exist in existing database tables
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'TimeFormat')
                    ALTER TABLE Users ADD TimeFormat INT NOT NULL DEFAULT 12;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'TimeZone')
                    ALTER TABLE Users ADD TimeZone NVARCHAR(100) NOT NULL DEFAULT 'UTC';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Language')
                    ALTER TABLE Users ADD Language NVARCHAR(10) NOT NULL DEFAULT 'en-US';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ResetToken')
                    ALTER TABLE Users ADD ResetToken NVARCHAR(256) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ResetTokenExpiry')
                    ALTER TABLE Users ADD ResetTokenExpiry DATETIME2 NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Phone')
                    ALTER TABLE Users ADD Phone NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'EmployeeId')
                    ALTER TABLE Users ADD EmployeeId NVARCHAR(50) NULL;

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Patients') AND name = 'BloodGroup')
                    ALTER TABLE Patients ADD BloodGroup INT NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Patients') AND name = 'MedicalHistory')
                    ALTER TABLE Patients ADD MedicalHistory NVARCHAR(MAX) NULL;

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvitationCodes')
                BEGIN
                    CREATE TABLE InvitationCodes (
                        InvitationCodeId INT IDENTITY(1,1) PRIMARY KEY,
                        Code NVARCHAR(100) NOT NULL,
                        CodeHash NVARCHAR(256) NOT NULL,
                        TargetRoleId INT NOT NULL,
                        BoundHospitalId NVARCHAR(100) NULL,
                        BoundEmail NVARCHAR(256) NULL,
                        BoundEmployeeId NVARCHAR(50) NULL,
                        IsUsed BIT NOT NULL DEFAULT 0,
                        UsedAt DATETIME2 NULL,
                        UsedByUserId INT NULL,
                        ExpiresAt DATETIME2 NOT NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        CreatedBy NVARCHAR(100) NULL,
                        UpdatedAt DATETIME2 NULL,
                        UpdatedBy NVARCHAR(100) NULL,
                        IsActive BIT NOT NULL DEFAULT 1,
                        RowVersion VARBINARY(MAX) NULL,
                        CONSTRAINT FK_InvitationCodes_Roles FOREIGN KEY (TargetRoleId) REFERENCES Roles(RoleId) ON DELETE CASCADE
                    );
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResetTokens')
                BEGIN
                    CREATE TABLE PasswordResetTokens (
                        PasswordResetTokenId INT IDENTITY(1,1) PRIMARY KEY,
                        Email NVARCHAR(256) NOT NULL,
                        TokenHash NVARCHAR(256) NOT NULL,
                        ExpiresAt DATETIME2 NOT NULL,
                        IsUsed BIT NOT NULL DEFAULT 0,
                        UsedAt DATETIME2 NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        CreatedBy NVARCHAR(100) NULL,
                        UpdatedAt DATETIME2 NULL,
                        UpdatedBy NVARCHAR(100) NULL,
                        IsActive BIT NOT NULL DEFAULT 1,
                        RowVersion VARBINARY(MAX) NULL
                    );
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StaffRegistrationRequests')
                BEGIN
                    CREATE TABLE StaffRegistrationRequests (
                        StaffRegistrationRequestId INT IDENTITY(1,1) PRIMARY KEY,
                        FullName NVARCHAR(100) NOT NULL,
                        Email NVARCHAR(256) NOT NULL,
                        Username NVARCHAR(50) NOT NULL,
                        PasswordHash NVARCHAR(MAX) NOT NULL,
                        EmployeeId NVARCHAR(50) NULL,
                        DepartmentId INT NULL,
                        RequestedRoleId INT NOT NULL,
                        InvitationCode NVARCHAR(100) NOT NULL,
                        Status INT NOT NULL DEFAULT 0,
                        ReviewedByUserId INT NULL,
                        ReviewedAt DATETIME2 NULL,
                        RejectionReason NVARCHAR(MAX) NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        CreatedBy NVARCHAR(100) NULL,
                        UpdatedAt DATETIME2 NULL,
                        UpdatedBy NVARCHAR(100) NULL,
                        IsActive BIT NOT NULL DEFAULT 1,
                        RowVersion VARBINARY(MAX) NULL,
                        CONSTRAINT FK_StaffReq_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId),
                        CONSTRAINT FK_StaffReq_Roles FOREIGN KEY (RequestedRoleId) REFERENCES Roles(RoleId) ON DELETE CASCADE,
                        CONSTRAINT FK_StaffReq_Users FOREIGN KEY (ReviewedByUserId) REFERENCES Users(UserId)
                    );
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmailLogs')
                BEGIN
                    CREATE TABLE EmailLogs (
                        EmailLogId INT IDENTITY(1,1) PRIMARY KEY,
                        StaffRegistrationRequestId INT NULL,
                        RecipientEmail NVARCHAR(256) NOT NULL,
                        Subject NVARCHAR(256) NOT NULL,
                        TemplateName NVARCHAR(100) NOT NULL,
                        Status INT NOT NULL DEFAULT 0,
                        ErrorMessage NVARCHAR(MAX) NULL,
                        SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        Attempts INT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        CreatedBy NVARCHAR(100) NULL,
                        UpdatedAt DATETIME2 NULL,
                        UpdatedBy NVARCHAR(100) NULL,
                        IsActive BIT NOT NULL DEFAULT 1,
                        RowVersion VARBINARY(MAX) NULL,
                        CONSTRAINT FK_EmailLogs_StaffReq FOREIGN KEY (StaffRegistrationRequestId) REFERENCES StaffRegistrationRequests(StaffRegistrationRequestId) ON DELETE SET NULL
                    );
                END
            ");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Schema alignment check encountered non-critical error.");
        }

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

        // 5. Seed Patients if empty
        if (!await context.Patients.AnyAsync())
        {
            logger.LogInformation("Seeding initial Sample Patients...");

            var patients = new[]
            {
                new Patient
                {
                    MedicalRecordNumber = "MRN-2026-0001",
                    FirstName = "John",
                    LastName = "Smith",
                    DateOfBirth = new DateTime(1985, 4, 12, 0, 0, 0, DateTimeKind.Utc),
                    Gender = Gender.Male,
                    Phone = "+1 (555) 111-2222",
                    Email = "john.smith@careflow.com",
                    Address = "123 Maple Street, New York, NY",
                    EmergencyContactName = "Mary Smith",
                    EmergencyContactPhone = "+1 (555) 111-9999",
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Patient
                {
                    MedicalRecordNumber = "MRN-2026-0002",
                    FirstName = "Emma",
                    LastName = "Watson",
                    DateOfBirth = new DateTime(1992, 9, 18, 0, 0, 0, DateTimeKind.Utc),
                    Gender = Gender.Female,
                    Phone = "+1 (555) 222-3333",
                    Email = "emma.watson@careflow.com",
                    Address = "456 Oak Avenue, Boston, MA",
                    EmergencyContactName = "Arthur Watson",
                    EmergencyContactPhone = "+1 (555) 222-8888",
                    CreatedAt = DateTime.UtcNow.AddDays(-25)
                },
                new Patient
                {
                    MedicalRecordNumber = "MRN-2026-0003",
                    FirstName = "Robert",
                    LastName = "Downey",
                    DateOfBirth = new DateTime(1975, 1, 25, 0, 0, 0, DateTimeKind.Utc),
                    Gender = Gender.Male,
                    Phone = "+1 (555) 333-4444",
                    Email = "robert.downey@careflow.com",
                    Address = "789 Pine Road, Los Angeles, CA",
                    EmergencyContactName = "Susan Downey",
                    EmergencyContactPhone = "+1 (555) 333-7777",
                    CreatedAt = DateTime.UtcNow.AddDays(-20)
                },
                new Patient
                {
                    MedicalRecordNumber = "MRN-2026-0004",
                    FirstName = "Sophia",
                    LastName = "Martinez",
                    DateOfBirth = new DateTime(1998, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                    Gender = Gender.Female,
                    Phone = "+1 (555) 444-5555",
                    Email = "sophia.martinez@careflow.com",
                    Address = "321 Cedar Lane, Chicago, IL",
                    EmergencyContactName = "Carlos Martinez",
                    EmergencyContactPhone = "+1 (555) 444-6666",
                    CreatedAt = DateTime.UtcNow.AddDays(-15)
                },
                new Patient
                {
                    MedicalRecordNumber = "MRN-2026-0005",
                    FirstName = "David",
                    LastName = "Beckham",
                    DateOfBirth = new DateTime(1980, 11, 5, 0, 0, 0, DateTimeKind.Utc),
                    Gender = Gender.Male,
                    Phone = "+1 (555) 555-6666",
                    Email = "david.beckham@careflow.com",
                    Address = "654 Elm Street, Miami, FL",
                    EmergencyContactName = "Victoria Beckham",
                    EmergencyContactPhone = "+1 (555) 555-5555",
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Patient
                {
                    MedicalRecordNumber = "MRN-2026-0006",
                    FirstName = "Grace",
                    LastName = "Hopper",
                    DateOfBirth = new DateTime(1990, 12, 9, 0, 0, 0, DateTimeKind.Utc),
                    Gender = Gender.Female,
                    Phone = "+1 (555) 666-7777",
                    Email = "grace.hopper@careflow.com",
                    Address = "987 Birch Drive, Seattle, WA",
                    EmergencyContactName = "Admiral Hopper",
                    EmergencyContactPhone = "+1 (555) 666-4444",
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                }
            };

            await context.Patients.AddRangeAsync(patients);
            await context.SaveChangesAsync();
            logger.LogInformation("Sample Patients seeded successfully.");
        }

        // 6. Seed Appointments if empty
        if (!await context.Appointments.AnyAsync())
        {
            logger.LogInformation("Seeding initial Sample Appointments...");

            var patients = await context.Patients.ToListAsync();
            var doctors = await context.Doctors.ToListAsync();

            if (patients.Any() && doctors.Any())
            {
                var p1 = patients.First(p => p.MedicalRecordNumber == "MRN-2026-0001");
                var p2 = patients.First(p => p.MedicalRecordNumber == "MRN-2026-0002");
                var p3 = patients.First(p => p.MedicalRecordNumber == "MRN-2026-0003");
                var p4 = patients.First(p => p.MedicalRecordNumber == "MRN-2026-0004");
                var p5 = patients.First(p => p.MedicalRecordNumber == "MRN-2026-0005");
                var p6 = patients.First(p => p.MedicalRecordNumber == "MRN-2026-0006");

                var doc1 = doctors.First(d => d.LicenseNumber == "DOC-1001"); // Cardiology
                var doc2 = doctors.First(d => d.LicenseNumber == "DOC-1002"); // Neurology
                var doc3 = doctors.First(d => d.LicenseNumber == "DOC-1003"); // Orthopedics
                var doc4 = doctors.First(d => d.LicenseNumber == "DOC-1004"); // Pediatrics

                var today = DateTime.UtcNow.Date;

                var appointments = new[]
                {
                    new Appointment
                    {
                        PatientId = p1.PatientId,
                        DoctorId = doc1.DoctorId,
                        AppointmentDate = today,
                        TimeSlot = TimeSpan.Parse("09:30:00"),
                        Reason = "Routine Cardiovascular Checkup",
                        Notes = "Patient reported mild palpitation last week.",
                        Status = AppointmentStatus.Completed,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Appointment
                    {
                        PatientId = p2.PatientId,
                        DoctorId = doc2.DoctorId,
                        AppointmentDate = today,
                        TimeSlot = TimeSpan.Parse("10:30:00"),
                        Reason = "Severe Migraine & Dizziness",
                        Notes = "Review MRI scan results.",
                        Status = AppointmentStatus.InConsultation,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Appointment
                    {
                        PatientId = p3.PatientId,
                        DoctorId = doc3.DoctorId,
                        AppointmentDate = today,
                        TimeSlot = TimeSpan.Parse("11:45:00"),
                        Reason = "Knee Joint Pain Consultation",
                        Notes = "Patient waiting in room 204.",
                        Status = AppointmentStatus.CheckedIn,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Appointment
                    {
                        PatientId = p4.PatientId,
                        DoctorId = doc4.DoctorId,
                        AppointmentDate = today,
                        TimeSlot = TimeSpan.Parse("14:00:00"),
                        Reason = "Pediatric Annual Checkup",
                        Notes = "Routine vaccination schedule.",
                        Status = AppointmentStatus.Confirmed,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Appointment
                    {
                        PatientId = p5.PatientId,
                        DoctorId = doc1.DoctorId,
                        AppointmentDate = today.AddDays(1),
                        TimeSlot = TimeSpan.Parse("10:00:00"),
                        Reason = "Post-operative ECG Evaluation",
                        Notes = "Check stress test baseline.",
                        Status = AppointmentStatus.Confirmed,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Appointment
                    {
                        PatientId = p6.PatientId,
                        DoctorId = doc2.DoctorId,
                        AppointmentDate = today.AddDays(-1),
                        TimeSlot = TimeSpan.Parse("15:30:00"),
                        Reason = "Neurological Consultation",
                        Notes = "Patient missed scheduled appointment.",
                        Status = AppointmentStatus.NoShow,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new Appointment
                    {
                        PatientId = p1.PatientId,
                        DoctorId = doc3.DoctorId,
                        AppointmentDate = today.AddDays(-2),
                        TimeSlot = TimeSpan.Parse("16:00:00"),
                        Reason = "Ankle Fracture Follow-up",
                        Notes = "Cancelled by patient via phone call.",
                        Status = AppointmentStatus.Cancelled,
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    }
                };

                await context.Appointments.AddRangeAsync(appointments);
                await context.SaveChangesAsync();
                logger.LogInformation("Sample Appointments seeded successfully.");
            }
        }

        // 7. Seed Invitation Codes if empty
        if (!await context.InvitationCodes.AnyAsync())
        {
            logger.LogInformation("Seeding system Invitation Codes for staff registration...");
            var roles = await context.Roles.ToDictionaryAsync(r => r.Name);

            var invitations = new[]
            {
                new InvitationCode
                {
                    Code = "ADMIN-2026",
                    CodeHash = passwordHasher.HashPassword("ADMIN-2026"),
                    TargetRoleId = roles["Admin"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddYears(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                },
                new InvitationCode
                {
                    Code = "DOC-CARDIO",
                    CodeHash = passwordHasher.HashPassword("DOC-CARDIO"),
                    TargetRoleId = roles["Doctor"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddYears(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                },
                new InvitationCode
                {
                    Code = "NURSE-ICU",
                    CodeHash = passwordHasher.HashPassword("NURSE-ICU"),
                    TargetRoleId = roles["Nurse"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddYears(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                },
                new InvitationCode
                {
                    Code = "RECEPT-MAIN",
                    CodeHash = passwordHasher.HashPassword("RECEPT-MAIN"),
                    TargetRoleId = roles["Receptionist"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddYears(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                },
                new InvitationCode
                {
                    Code = "PHARMA-MAIN",
                    CodeHash = passwordHasher.HashPassword("PHARMA-MAIN"),
                    TargetRoleId = roles["Pharmacist"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddYears(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                },
                new InvitationCode
                {
                    Code = "LAB-MICRO",
                    CodeHash = passwordHasher.HashPassword("LAB-MICRO"),
                    TargetRoleId = roles["LabTechnician"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddYears(1),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                },
                new InvitationCode
                {
                    Code = "EXPIRED-2025",
                    CodeHash = passwordHasher.HashPassword("EXPIRED-2025"),
                    TargetRoleId = roles["Doctor"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddDays(-10),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new InvitationCode
                {
                    Code = "USED-CODE-999",
                    CodeHash = passwordHasher.HashPassword("USED-CODE-999"),
                    TargetRoleId = roles["Receptionist"].RoleId,
                    BoundHospitalId = "CAREFLOW-HQ",
                    ExpiresAt = DateTime.UtcNow.AddDays(10),
                    IsUsed = true,
                    UsedAt = DateTime.UtcNow.AddDays(-1),
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                }
            };

            await context.InvitationCodes.AddRangeAsync(invitations);
            await context.SaveChangesAsync();
            logger.LogInformation("Invitation Codes seeded successfully.");
        }

        // 8. Seed Sample Staff Registration Requests & Email Logs if empty
        if (!await context.StaffRegistrationRequests.AnyAsync())
        {
            logger.LogInformation("Seeding sample Staff Registration Requests & Email Logs...");
            var roles = await context.Roles.ToDictionaryAsync(r => r.Name);
            var depts = await context.Departments.ToDictionaryAsync(d => d.Name);
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");

            var req1 = new StaffRegistrationRequest
            {
                FullName = "Dr. Sarah Jenkins",
                Email = "sarah@example.com",
                Username = "sjenkins",
                PasswordHash = passwordHasher.HashPassword("Sarah123!"),
                EmployeeId = "EMP-00125",
                DepartmentId = depts.ContainsKey("Cardiology") ? depts["Cardiology"].DepartmentId : null,
                RequestedRoleId = roles["Doctor"].RoleId,
                InvitationCode = "DOC-CARDIO",
                Status = RegistrationStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddHours(-3)
            };

            var req2 = new StaffRegistrationRequest
            {
                FullName = "Michael Thomas",
                Email = "michael@example.com",
                Username = "mthomas",
                PasswordHash = passwordHasher.HashPassword("Michael123!"),
                EmployeeId = "EMP-00126",
                DepartmentId = depts.ContainsKey("Neurology") ? depts["Neurology"].DepartmentId : null,
                RequestedRoleId = roles["Nurse"].RoleId,
                InvitationCode = "NURSE-ICU",
                Status = RegistrationStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            };

            var req3 = new StaffRegistrationRequest
            {
                FullName = "Priya Sharma",
                Email = "priya@example.com",
                Username = "psharma",
                PasswordHash = passwordHasher.HashPassword("Priya123!"),
                EmployeeId = "EMP-00127",
                DepartmentId = depts.ContainsKey("Pediatrics") ? depts["Pediatrics"].DepartmentId : null,
                RequestedRoleId = roles["Receptionist"].RoleId,
                InvitationCode = "RECEPT-MAIN",
                Status = RegistrationStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            };

            var req4 = new StaffRegistrationRequest
            {
                FullName = "Dr. David Kim",
                Email = "david.kim@example.com",
                Username = "dkim",
                PasswordHash = passwordHasher.HashPassword("David123!"),
                EmployeeId = "EMP-00120",
                DepartmentId = depts.ContainsKey("Cardiology") ? depts["Cardiology"].DepartmentId : null,
                RequestedRoleId = roles["Doctor"].RoleId,
                InvitationCode = "DOC-CARDIO",
                Status = RegistrationStatus.Approved,
                ReviewedByUserId = adminUser?.UserId,
                ReviewedAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };

            var req5 = new StaffRegistrationRequest
            {
                FullName = "Alex Carter",
                Email = "alex.carter@example.com",
                Username = "acarter",
                PasswordHash = passwordHasher.HashPassword("Alex123!"),
                EmployeeId = "EMP-00118",
                DepartmentId = depts.ContainsKey("Orthopedics") ? depts["Orthopedics"].DepartmentId : null,
                RequestedRoleId = roles["Receptionist"].RoleId,
                InvitationCode = "RECEPT-MAIN",
                Status = RegistrationStatus.Rejected,
                ReviewedByUserId = adminUser?.UserId,
                ReviewedAt = DateTime.UtcNow.AddDays(-1),
                RejectionReason = "Employee ID could not be verified with HR credentials database.",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            };

            await context.StaffRegistrationRequests.AddRangeAsync(req1, req2, req3, req4, req5);
            await context.SaveChangesAsync();

            // Seed initial Email Delivery Logs for requests
            var logs = new[]
            {
                new EmailLog { StaffRegistrationRequestId = req1.StaffRegistrationRequestId, RecipientEmail = req1.Email, Subject = "CareFlow HMS - Staff Registration Request Received", TemplateName = "RegistrationConfirmation", Status = EmailDeliveryStatus.Sent, SentAt = req1.CreatedAt },
                new EmailLog { StaffRegistrationRequestId = req2.StaffRegistrationRequestId, RecipientEmail = req2.Email, Subject = "CareFlow HMS - Staff Registration Request Received", TemplateName = "RegistrationConfirmation", Status = EmailDeliveryStatus.Sent, SentAt = req2.CreatedAt },
                new EmailLog { StaffRegistrationRequestId = req3.StaffRegistrationRequestId, RecipientEmail = req3.Email, Subject = "CareFlow HMS - Staff Registration Request Received", TemplateName = "RegistrationConfirmation", Status = EmailDeliveryStatus.Failed, ErrorMessage = "SMTP connection timeout to local server port 1025.", SentAt = req3.CreatedAt },
                new EmailLog { StaffRegistrationRequestId = req4.StaffRegistrationRequestId, RecipientEmail = req4.Email, Subject = "CareFlow HMS - Staff Account Approved & Activated", TemplateName = "StaffApproval", Status = EmailDeliveryStatus.Sent, SentAt = req4.ReviewedAt ?? DateTime.UtcNow },
                new EmailLog { StaffRegistrationRequestId = req5.StaffRegistrationRequestId, RecipientEmail = req5.Email, Subject = "CareFlow HMS - Staff Registration Request Update", TemplateName = "StaffRejection", Status = EmailDeliveryStatus.Sent, SentAt = req5.ReviewedAt ?? DateTime.UtcNow }
            };

            await context.EmailLogs.AddRangeAsync(logs);
            await context.SaveChangesAsync();
            logger.LogInformation("Sample Staff Registration Requests & Email Logs seeded successfully.");
        }
    }
}
