using HospitalManagement.Domain.Common;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Domain.Entities;

public class EmailLog : BaseEntity
{
    public int EmailLogId { get; set; }
    public int? StaffRegistrationRequestId { get; set; }
    public StaffRegistrationRequest? StaffRegistrationRequest { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public EmailDeliveryStatus Status { get; set; } = EmailDeliveryStatus.Queued;
    public string? ErrorMessage { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public int Attempts { get; set; } = 1;
}

