using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class Role : BaseEntity
{
    public int RoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Level { get; set; } = 10;

    public int? ParentRoleId { get; set; }
    public Role? ParentRole { get; set; }

    public ICollection<Role> ChildRoles { get; set; } = new List<Role>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
