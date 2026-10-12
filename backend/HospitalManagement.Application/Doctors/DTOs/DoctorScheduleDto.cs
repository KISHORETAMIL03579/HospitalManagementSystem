namespace HospitalManagement.Application.Doctors.DTOs;

public class DoctorScheduleDto
{
    public int ScheduleId { get; set; }
    public int DoctorId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDurationMinutes { get; set; } = 30;
    public string? SessionName { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SaveDoctorScheduleDto
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDurationMinutes { get; set; } = 30;
    public string? SessionName { get; set; }
}
