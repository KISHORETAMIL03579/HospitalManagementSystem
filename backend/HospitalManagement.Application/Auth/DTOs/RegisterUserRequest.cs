using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Auth.DTOs;

public class RegisterUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string InvitationCode { get; set; } = string.Empty;

    /// <summary>
    /// Optional client-requested role. Note: Server security policies IGNORE this value 
    /// and strictly enforce the role authorized by the verified invitation code.
    /// </summary>
    public UserRole? Role { get; set; }
}
