namespace HospitalManagement.Application.Doctors.DTOs;

public class DoctorDto
{
    public int DoctorId { get; set; }
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string AvailableDays { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}
