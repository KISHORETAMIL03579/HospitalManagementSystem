namespace HospitalManagement.Application.Doctors.DTOs;

public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DoctorCount { get; set; }
}
