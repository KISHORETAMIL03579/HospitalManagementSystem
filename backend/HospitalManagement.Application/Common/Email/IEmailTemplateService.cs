namespace HospitalManagement.Application.Common.Email;

/// <summary>
/// Service responsible for loading and rendering strongly typed, responsive HTML email templates with sanitized inputs.
/// </summary>
public interface IEmailTemplateService
{
    /// <summary>
    /// Render a specific template by name with raw dictionary placeholders.
    /// All values are automatically HTML-encoded for security, except URLs which are validated.
    /// </summary>
    string RenderTemplate(string templateName, IDictionary<string, string> placeholders);

    /// <summary>
    /// Render staff invitation email template with account activation link.
    /// </summary>
    string RenderStaffInvitation(string fullName, string username, string role, string activationUrl, string expiryTime);

    /// <summary>
    /// Render staff registration approval notification email.
    /// </summary>
    string RenderAccountApproved(string fullName, string role, string loginUrl);

    /// <summary>
    /// Render staff registration rejection update email.
    /// </summary>
    string RenderAccountRejected(string fullName, string reason, string contactUrl);

    /// <summary>
    /// Render secure password reset email with time-limited token link.
    /// </summary>
    string RenderPasswordReset(string fullName, string email, string resetUrl, int expiryMinutes);

    /// <summary>
    /// Render security confirmation email when an account password is changed.
    /// </summary>
    string RenderPasswordChanged(string fullName, string timestamp, string secureAccountUrl);

    /// <summary>
    /// Render patient appointment confirmation email with clinical booking details.
    /// </summary>
    string RenderAppointmentConfirmation(string patientName, string appointmentDate, string doctorName, string department, string location, string referenceNumber, string detailsUrl);

    /// <summary>
    /// Render upcoming patient appointment reminder notification.
    /// </summary>
    string RenderAppointmentReminder(string patientName, string appointmentDate, string doctorName, string department, string location, string referenceNumber, string detailsUrl);

    /// <summary>
    /// Render notification when an account access status is deactivated or modified.
    /// </summary>
    string RenderAccountDeactivated(string fullName, string reason, string contactUrl);
}
