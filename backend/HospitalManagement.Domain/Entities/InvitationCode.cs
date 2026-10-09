using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class InvitationCode : BaseEntity
{
    public int InvitationCodeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public int TargetRoleId { get; set; }
    public Role TargetRole { get; set; } = null!;
    public string? BoundHospitalId { get; set; } = "CAREFLOW-HQ";
    public string? BoundEmail { get; set; }
    public string? BoundEmployeeId { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
    public int? UsedByUserId { get; set; }
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);
}

