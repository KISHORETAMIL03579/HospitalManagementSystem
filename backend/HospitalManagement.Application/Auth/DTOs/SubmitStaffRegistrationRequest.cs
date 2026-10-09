namespace HospitalManagement.Application.Auth.DTOs;

public class SubmitStaffRegistrationRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string InvitationCode { get; set; } = string.Empty;
    public int? RequestedRoleId { get; set; }
}

