namespace HospitalManagement.Application.Doctors.DTOs;

public class DoctorDirectoryItemDto
{
    public int DoctorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public int YearsOfExperience { get; set; } = 8;
    public double Rating { get; set; } = 4.9;
    public int ReviewCount { get; set; } = 34;
    public string Languages { get; set; } = "English";
    public string Biography { get; set; } = string.Empty;

    // Real-time calculated status
    public string AvailabilityStatus { get; set; } = "Unavailable"; // "Available now", "Available today", "Available later", "Fully booked", "On leave", "Unavailable"
    public string StatusBadge { get; set; } = "Unavailable";
    public string? NextAvailableSlotText { get; set; } // e.g. "Next slot: 10:30 AM", "Available tomorrow at 09:00 AM"
    public DateOnly? NextAvailableDate { get; set; }
    public TimeOnly? NextAvailableTime { get; set; }
    public bool IsActive { get; set; } = true;
}
