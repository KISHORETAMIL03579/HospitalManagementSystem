namespace HospitalManagement.Application.Doctors.DTOs;

public class DoctorAvailabilityDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public DateOnly Date { get; set; }
    public string TimeZone { get; set; } = "UTC";

    // Calculated live status: "Available now", "Available today", "Available later", "Fully booked", "On leave", "Unavailable", "Inactive"
    public string AvailabilityStatus { get; set; } = "Unavailable";
    public string StatusMessage { get; set; } = string.Empty; // e.g. "Next slot: 10:30 AM", "On leave: Medical Conference"
    public TimeOnly? NextAvailableSlot { get; set; }

    public int TotalSlotsCount { get; set; }
    public int BookableSlotsCount { get; set; }
    public int BookedSlotsCount { get; set; }
    public int BlockedSlotsCount { get; set; }

    public List<TimeSlotDto> Slots { get; set; } = new();
}
