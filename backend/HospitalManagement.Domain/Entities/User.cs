using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Entities;

public class User : BaseEntity
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? Phone { get; set; }

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public TimeFormat TimeFormat { get; set; } = TimeFormat.Hour12;
    public string TimeZone { get; set; } = "UTC";
    public string Language { get; set; } = "en-US";

    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
