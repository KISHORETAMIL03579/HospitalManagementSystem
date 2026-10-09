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
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Confirmed;
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public void Confirm()
    {
        if (Status != AppointmentStatus.Pending)
            throw new InvalidOperationException("Only pending appointments can be confirmed.");
        Status = AppointmentStatus.Confirmed;
    }

    public void CheckIn()
    {
        if (Status != AppointmentStatus.Confirmed && Status != AppointmentStatus.Pending)
            throw new InvalidOperationException("Only confirmed or pending appointments can be checked in.");
        Status = AppointmentStatus.CheckedIn;
    }

    public void StartConsultation()
    {
        if (Status != AppointmentStatus.CheckedIn)
            throw new InvalidOperationException("Patient must be checked in before starting consultation.");
        Status = AppointmentStatus.InConsultation;
    }

    public void Complete()
    {
        if (Status != AppointmentStatus.InConsultation)
            throw new InvalidOperationException("Only an active consultation can be completed.");
        Status = AppointmentStatus.Completed;
    }

    public void Cancel()
    {
        if (Status == AppointmentStatus.Completed || Status == AppointmentStatus.Cancelled)
            throw new InvalidOperationException("Completed or cancelled appointments cannot be cancelled.");
        Status = AppointmentStatus.Cancelled;
    }

    public void MarkNoShow()
    {
        if (Status == AppointmentStatus.Completed || Status == AppointmentStatus.Cancelled)
            throw new InvalidOperationException("Cannot mark completed or cancelled appointment as no-show.");
        Status = AppointmentStatus.NoShow;
    }
}
