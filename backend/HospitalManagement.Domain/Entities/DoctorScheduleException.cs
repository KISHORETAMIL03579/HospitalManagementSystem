using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Entities;

public class DoctorScheduleException : BaseEntity
{
    public int ExceptionId { get; set; }

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateOnly Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }

    public ScheduleExceptionType ExceptionType { get; set; } = ScheduleExceptionType.Unavailable;
    public string? Reason { get; set; }
}

