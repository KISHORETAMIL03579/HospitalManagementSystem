using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Auth.DTOs;

public class StaffRegistrationRequestDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int RequestedRoleId { get; set; }
    public string RequestedRoleName { get; set; } = string.Empty;
    public string InvitationCode { get; set; } = string.Empty;
    public RegistrationStatus Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByName { get; set; }
    public string? RejectionReason { get; set; }

    // Email Delivery Tracking Fields
    public EmailDeliveryStatus EmailStatus { get; set; } = EmailDeliveryStatus.Sent;
    public DateTime? LastEmailAttempt { get; set; }
    public string? EmailErrorMessage { get; set; }
    public int? EmailLogId { get; set; }
}
