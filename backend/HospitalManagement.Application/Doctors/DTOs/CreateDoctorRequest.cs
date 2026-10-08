namespace HospitalManagement.Application.Doctors.DTOs;

public class CreateDoctorRequest
{
    public int DepartmentId { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; } = 100.00m;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string AvailableDays { get; set; } = "Monday,Tuesday,Wednesday,Thursday,Friday";
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "17:00";
}
