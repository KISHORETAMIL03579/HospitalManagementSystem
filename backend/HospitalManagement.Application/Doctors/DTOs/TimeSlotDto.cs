namespace HospitalManagement.Application.Doctors.DTOs;

public class TimeSlotDto
{
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string FormattedTime { get; set; } = string.Empty; // e.g. "09:00 AM" or "09:00 - 09:30"
    public bool IsBookable { get; set; }
    public string Status { get; set; } = "Available"; // "Available", "Booked", "Blocked", "Break", "Past"
    public string? SessionName { get; set; }
    public string? BlockReason { get; set; }
}
