using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class Permission : BaseEntity
{
    public int PermissionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

