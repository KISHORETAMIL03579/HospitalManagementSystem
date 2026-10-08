using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Auth.DTOs;

public class UserDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string RoleName => Role.ToString();
    public int HierarchyLevel => (int)Role;
    public List<string> Permissions => RolePermissions.GetPermissions(Role);
    public DateTime? LastLoginAt { get; set; }
}
