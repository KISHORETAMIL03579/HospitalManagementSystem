using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class DoctorSchedule : BaseEntity
{
    public int ScheduleId { get; set; }

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public int SlotDurationMinutes { get; set; } = 30;
    public string? SessionName { get; set; }
}

