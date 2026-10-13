using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Auth.DTOs;

public class UserDto
{
    private string? _roleName;

    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public string RoleName
    {
        get => !string.IsNullOrWhiteSpace(_roleName) ? _roleName : Role.ToString();
        set => _roleName = value;
    }
    public int HierarchyLevel => (int)Role;
    public List<string> Permissions => RolePermissions.GetPermissions(Role);
    public DateTime? LastLoginAt { get; set; }

    public TimeFormat TimeFormat { get; set; } = TimeFormat.Hour12;
    public string TimeZone { get; set; } = "UTC";
    public string Language { get; set; } = "en-US";
}
