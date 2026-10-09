namespace HospitalManagement.Application.Auth.DTOs;

public class UpdateUserRoleRequest
{
    public int RoleId { get; set; }
}

public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}
