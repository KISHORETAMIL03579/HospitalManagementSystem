using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Common.Email;

public interface IEmailService
{
    // Auth & Identity Workflows
    Task<EmailLog> SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default);
    Task<EmailLog> SendPasswordResetEmailAsync(string email, string resetToken, string? fullName, CancellationToken cancellationToken = default);
    Task<EmailLog> SendPasswordChangedEmailAsync(string email, string fullName, CancellationToken cancellationToken = default);

    // Staff Onboarding & Approval Workflows
    Task<EmailLog> SendStaffInvitationEmailAsync(string email, string fullName, string username, string role, string activationUrl, string expiryTime, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendRegistrationConfirmationEmailAsync(string email, string fullName, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendAdminRegistrationAlertEmailAsync(string adminEmail, string applicantName, string applicantRole, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendStaffApprovalEmailAsync(string email, string fullName, string roleName, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendStaffRejectionEmailAsync(string email, string fullName, string reason, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendAccountDeactivatedEmailAsync(string email, string fullName, string reason, CancellationToken cancellationToken = default);

    // Clinical & Patient Scheduling Workflows
    Task<EmailLog> SendAppointmentConfirmationEmailAsync(string email, string patientName, string appointmentDate, string doctorName, string department, string location, string referenceNumber, CancellationToken cancellationToken = default);
    Task<EmailLog> SendAppointmentReminderEmailAsync(string email, string patientName, string appointmentDate, string doctorName, string department, string location, string referenceNumber, CancellationToken cancellationToken = default);
}
