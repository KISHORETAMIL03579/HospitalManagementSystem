using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Common.Email;

public interface IEmailService
{
    Task<EmailLog> SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default);
    Task<EmailLog> SendRegistrationConfirmationEmailAsync(string email, string fullName, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendAdminRegistrationAlertEmailAsync(string adminEmail, string applicantName, string applicantRole, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendStaffApprovalEmailAsync(string email, string fullName, string roleName, int? requestId = null, CancellationToken cancellationToken = default);
    Task<EmailLog> SendStaffRejectionEmailAsync(string email, string fullName, string reason, int? requestId = null, CancellationToken cancellationToken = default);
}
