namespace HospitalManagement.Application.Auth.DTOs;

public class UpdateUserByAdminRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
    public int RoleId { get; set; }
}
