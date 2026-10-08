using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class Doctor : BaseEntity
{
    public int DoctorId { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public string LicenseNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; } = 100.00m;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvailableDays { get; set; } = "Monday,Tuesday,Wednesday,Thursday,Friday";
    public TimeSpan StartTime { get; set; } = new TimeSpan(9, 0, 0); // 09:00 AM
    public TimeSpan EndTime { get; set; } = new TimeSpan(17, 0, 0);  // 05:00 PM

    public string FullName => $"Dr. {FirstName} {LastName}";

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
