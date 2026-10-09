using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class PasswordResetToken : BaseEntity
{
    public int PasswordResetTokenId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
}

