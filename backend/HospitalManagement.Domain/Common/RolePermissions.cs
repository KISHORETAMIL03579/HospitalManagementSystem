using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Common;

public static class Permissions
{
    // User & System Administration
    public const string ManageUsers = "Permissions.ManageUsers";
    public const string ManageSystem = "Permissions.ManageSystem";
    public const string UserView = "User.View";
    public const string UserCreate = "User.Create";
    public const string UserUpdate = "User.Update";
    public const string UserDeactivate = "User.Deactivate";
    public const string UserAssignRole = "User.AssignRole";
    public const string AuditView = "Audit.View";
    public const string AuditExport = "Audit.Export";

    // Patient Directory & Profile
    public const string ViewPatient = "Patient.View";
    public const string RegisterPatient = "Patient.Create";
    public const string UpdatePatient = "Patient.Update";
    public const string DeactivatePatient = "Patient.Deactivate";
    public const string SearchPatient = "Patient.Search";
    public const string ViewOwnProfile = "Patient.ViewOwn";

    // Clinical, EHR & Encounters
    public const string ViewEncounter = "Encounter.View";
    public const string CreateEncounter = "Encounter.Create";
    public const string UpdateEncounter = "Encounter.Update";
    public const string SignEncounter = "Encounter.Sign";

    public const string ViewDiagnosis = "Diagnosis.View";
    public const string CreateDiagnosis = "Diagnosis.Create";
    public const string UpdateDiagnosis = "Diagnosis.Update";

    public const string ViewPrescription = "Prescription.View";
    public const string CreatePrescription = "Prescription.Create";
    public const string UpdatePrescription = "Prescription.Update";
    public const string CancelPrescription = "Prescription.Cancel";
    public const string SignPrescription = "Prescription.Sign";
    public const string DispenseMedication = "Prescription.Dispense";

    public const string RecordVitals = "Clinical.RecordVitals";

    // Laboratory
    public const string CreateLabOrder = "LabOrder.Create";
    public const string ViewLabOrder = "LabOrder.View";
    public const string ViewLabResult = "LabResult.View";
    public const string EnterLabResult = "LabResult.Enter";
    public const string VerifyLabResult = "LabResult.Verify";
    public const string ViewOwnLabResults = "LabResult.ViewOwn";

    // Appointments & Scheduling
    public const string ViewAppointment = "Appointment.View";
    public const string CreateAppointment = "Appointment.Create";
    public const string UpdateAppointment = "Appointment.Update";
    public const string CancelAppointment = "Appointment.Cancel";
    public const string CheckInPatient = "Appointment.CheckIn";
    public const string RescheduleAppointment = "Appointment.Reschedule";
    public const string ViewOwnAppointments = "Appointment.ViewOwn";

    // Billing & Finance
    public const string ViewInvoice = "Invoice.View";
    public const string CreateInvoice = "Invoice.Create";
    public const string CreatePayment = "Payment.Create";
    public const string ViewPayment = "Payment.View";
}

public static class RolePermissions
{
    private static readonly Dictionary<UserRole, List<string>> Map = new()
    {
        [UserRole.Admin] = new List<string>
        {
            Permissions.ManageUsers,
            Permissions.ManageSystem,
            Permissions.UserView,
            Permissions.UserCreate,
            Permissions.UserUpdate,
            Permissions.UserDeactivate,
            Permissions.UserAssignRole,
            Permissions.AuditView,
            Permissions.AuditExport,
            Permissions.ViewPatient,
            Permissions.RegisterPatient,
            Permissions.UpdatePatient,
            Permissions.DeactivatePatient,
            Permissions.SearchPatient,
            Permissions.CreateAppointment,
            Permissions.ViewAppointment,
            Permissions.UpdateAppointment,
            Permissions.CancelAppointment,
            Permissions.CheckInPatient,
            Permissions.RescheduleAppointment,
            Permissions.CreateEncounter,
            Permissions.ViewEncounter,
            Permissions.CreatePrescription,
            Permissions.RecordVitals,
            Permissions.ViewLabResult,
            Permissions.ViewInvoice,
            Permissions.CreateInvoice
        },
        [UserRole.Doctor] = new List<string>
        {
            Permissions.ViewPatient,
            Permissions.SearchPatient,
            Permissions.ViewEncounter,
            Permissions.CreateEncounter,
            Permissions.UpdateEncounter,
            Permissions.SignEncounter,
            Permissions.ViewDiagnosis,
            Permissions.CreateDiagnosis,
            Permissions.UpdateDiagnosis,
            Permissions.ViewPrescription,
            Permissions.CreatePrescription,
            Permissions.UpdatePrescription,
            Permissions.SignPrescription,
            Permissions.CreateLabOrder,
            Permissions.ViewLabOrder,
            Permissions.ViewLabResult,
            Permissions.VerifyLabResult,
            Permissions.ViewAppointment,
            Permissions.RecordVitals
        },
        [UserRole.Nurse] = new List<string>
        {
            Permissions.ViewPatient,
            Permissions.SearchPatient,
            Permissions.RecordVitals,
            Permissions.ViewEncounter,
            Permissions.ViewAppointment,
            Permissions.CheckInPatient,
            Permissions.ViewPrescription,
            Permissions.ViewLabResult
        },
        [UserRole.Receptionist] = new List<string>
        {
            Permissions.RegisterPatient,
            Permissions.ViewPatient,
            Permissions.UpdatePatient,
            Permissions.SearchPatient,
            Permissions.CreateAppointment,
            Permissions.ViewAppointment,
            Permissions.UpdateAppointment,
            Permissions.CancelAppointment,
            Permissions.CheckInPatient,
            Permissions.RescheduleAppointment,
            Permissions.ViewInvoice,
            Permissions.CreatePayment
        },
        [UserRole.Patient] = new List<string>
        {
            Permissions.ViewOwnProfile,
            Permissions.ViewOwnAppointments,
            Permissions.ViewOwnLabResults,
            Permissions.ViewPrescription
        }
    };

    public static List<string> GetPermissions(UserRole role)
    {
        return Map.TryGetValue(role, out var permissions) ? permissions : new List<string>();
    }

    public static int GetHierarchyLevel(UserRole role) => (int)role;
}

