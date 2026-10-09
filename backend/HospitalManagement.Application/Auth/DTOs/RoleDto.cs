namespace HospitalManagement.Application.Auth.DTOs;

public class RoleDto
{
    public int RoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Level { get; set; }
    public int? ParentRoleId { get; set; }
    public List<string> Permissions { get; set; } = new();
}

