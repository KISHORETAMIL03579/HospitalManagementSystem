using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Entities;

public class Patient : BaseEntity
{
    public int PatientId { get; set; }
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }

    public string FullName => $"{FirstName} {LastName}";

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
