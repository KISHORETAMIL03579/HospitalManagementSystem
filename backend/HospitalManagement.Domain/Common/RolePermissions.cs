using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Common;

public static class Permissions
{
    // User & System Administration
    public const string ManageUsers = "Permissions.ManageUsers";
    public const string ManageSystem = "Permissions.ManageSystem";

    // Patient Directory & Profile
    public const string ViewPatient = "Permissions.ViewPatient";
    public const string RegisterPatient = "Permissions.RegisterPatient";
    public const string ViewOwnProfile = "Permissions.ViewOwnProfile";

    // Clinical, EHR & Encounters
    public const string CreateEncounter = "Permissions.CreateEncounter";
    public const string CreatePrescription = "Permissions.CreatePrescription";
    public const string ViewLabResult = "Permissions.ViewLabResult";
    public const string EnterLabResult = "Permissions.EnterLabResult";
    public const string RecordVitals = "Permissions.RecordVitals";

    // Appointments & Scheduling
    public const string CreateAppointment = "Permissions.CreateAppointment";
    public const string ViewAppointment = "Permissions.ViewAppointment";
    public const string CheckInPatient = "Permissions.CheckInPatient";
    public const string DispenseMedication = "Permissions.DispenseMedication";
    public const string ViewOwnAppointments = "Permissions.ViewOwnAppointments";
    public const string ViewOwnLabResults = "Permissions.ViewOwnLabResults";
}

public static class RolePermissions
{
    private static readonly Dictionary<UserRole, List<string>> Map = new()
    {
        [UserRole.Admin] = new List<string>
        {
            Permissions.ManageUsers,
            Permissions.ManageSystem,
            Permissions.ViewPatient,
            Permissions.RegisterPatient,
            Permissions.CreateAppointment,
            Permissions.ViewAppointment,
            Permissions.CheckInPatient,
            Permissions.CreateEncounter,
            Permissions.CreatePrescription,
            Permissions.RecordVitals,
            Permissions.ViewLabResult
        },
        [UserRole.Doctor] = new List<string>
        {
            Permissions.ViewPatient,
            Permissions.CreateEncounter,
            Permissions.CreatePrescription,
            Permissions.ViewLabResult,
            Permissions.ViewAppointment,
            Permissions.RecordVitals
        },
        [UserRole.Nurse] = new List<string>
        {
            Permissions.ViewPatient,
            Permissions.RecordVitals,
            Permissions.ViewAppointment,
            Permissions.ViewLabResult
        },
        [UserRole.Receptionist] = new List<string>
        {
            Permissions.RegisterPatient,
            Permissions.CreateAppointment,
            Permissions.ViewAppointment,
            Permissions.CheckInPatient,
            Permissions.ViewPatient
        },
        [UserRole.Patient] = new List<string>
        {
            Permissions.ViewOwnProfile,
            Permissions.ViewOwnAppointments,
            Permissions.ViewOwnLabResults
        }
    };

    public static List<string> GetPermissions(UserRole role)
    {
        return Map.TryGetValue(role, out var permissions) ? permissions : new List<string>();
    }

    public static int GetHierarchyLevel(UserRole role) => (int)role;
}

