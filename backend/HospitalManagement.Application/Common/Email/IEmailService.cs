namespace HospitalManagement.Application.Common.Email;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default);
    Task SendRegistrationConfirmationEmailAsync(string email, string fullName, CancellationToken cancellationToken = default);
    Task SendAdminRegistrationAlertEmailAsync(string adminEmail, string applicantName, string applicantRole, CancellationToken cancellationToken = default);
    Task SendStaffApprovalEmailAsync(string email, string fullName, string roleName, CancellationToken cancellationToken = default);
    Task SendStaffRejectionEmailAsync(string email, string fullName, string reason, CancellationToken cancellationToken = default);
}

