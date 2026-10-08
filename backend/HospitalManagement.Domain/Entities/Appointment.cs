using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Entities;

public class Appointment : BaseEntity
{
    public int AppointmentId { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateTime AppointmentDate { get; set; }
    public TimeSpan TimeSlot { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
