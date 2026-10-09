namespace HospitalManagement.Application.Auth.DTOs;

public class CreateUserByAdminRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string? EmployeeId { get; set; }
    public string? Phone { get; set; }
}
