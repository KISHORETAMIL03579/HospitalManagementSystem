using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public enum RegistrationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class StaffRegistrationRequest : BaseEntity
{
    public int StaffRegistrationRequestId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public int RequestedRoleId { get; set; }
    public Role RequestedRole { get; set; } = null!;

    public string InvitationCode { get; set; } = string.Empty;
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;

    public int? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
}

