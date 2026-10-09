namespace HospitalManagement.Application.Auth.DTOs;

public class ApproveStaffRequest
{
    public int? AuthorizedRoleId { get; set; }
    public string? Notes { get; set; }
}

public class RejectStaffRequest
{
    public string Reason { get; set; } = string.Empty;
}

