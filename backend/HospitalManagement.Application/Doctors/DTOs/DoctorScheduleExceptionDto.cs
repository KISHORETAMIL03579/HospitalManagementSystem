using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Doctors.DTOs;

public class DoctorScheduleExceptionDto
{
    public int ExceptionId { get; set; }
    public int DoctorId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public ScheduleExceptionType ExceptionType { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDoctorScheduleExceptionDto
{
    public DateOnly Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public ScheduleExceptionType ExceptionType { get; set; } = ScheduleExceptionType.Unavailable;
    public string? Reason { get; set; }
}

public class ConflictCheckResultDto
{
    public bool HasConflicts { get; set; }
    public int ConflictCount { get; set; }
    public List<ConflictingAppointmentDto> ConflictingAppointments { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

public class ConflictingAppointmentDto
{
    public int AppointmentId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string MedicalRecordNumber { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public TimeSpan TimeSlot { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
