using System.Net;
using System.Net.Mail;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HospitalManagement.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtpSettings;
    private readonly IEmailTemplateService _templateService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<SmtpSettings> smtpSettings,
        IEmailTemplateService templateService,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailService> logger)
    {
        _smtpSettings = smtpSettings.Value;
        _templateService = templateService;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public Task<EmailLog> SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default)
    {
        return SendPasswordResetEmailAsync(email, resetToken, fullName: null, cancellationToken);
    }

    public async Task<EmailLog> SendPasswordResetEmailAsync(string email, string resetToken, string? fullName, CancellationToken cancellationToken = default)
    {
        var baseUrl = !string.IsNullOrWhiteSpace(_smtpSettings.FrontendBaseUrl) ? _smtpSettings.FrontendBaseUrl : "http://localhost:5173";
        var resetUrl = $"{baseUrl}/reset-password?token={resetToken}&email={Uri.EscapeDataString(email)}";
        var subject = "Reset your CareFlow HMS password";

        var body = _templateService.RenderPasswordReset(
            fullName: fullName ?? "CareFlow User",
            email: email,
            resetUrl: resetUrl,
            expiryMinutes: 30);

        return await DeliverAndLogEmailAsync(email, subject, body, "PasswordResetEmail", null, cancellationToken);
    }

    public async Task<EmailLog> SendPasswordChangedEmailAsync(string email, string fullName, CancellationToken cancellationToken = default)
    {
        var baseUrl = !string.IsNullOrWhiteSpace(_smtpSettings.FrontendBaseUrl) ? _smtpSettings.FrontendBaseUrl : "http://localhost:5173";
        var secureUrl = $"{baseUrl}/login";
        var subject = "Your CareFlow HMS password was changed";

        var body = _templateService.RenderPasswordChanged(
            fullName: fullName,
            timestamp: DateTime.UtcNow.ToString("MMM dd, yyyy HH:mm 'UTC'"),
            secureAccountUrl: secureUrl);

        return await DeliverAndLogEmailAsync(email, subject, body, "PasswordChangedEmail", null, cancellationToken);
    }

    public async Task<EmailLog> SendStaffInvitationEmailAsync(
        string email,
        string fullName,
        string username,
        string role,
        string activationUrl,
        string expiryTime,
        int? requestId = null,
        CancellationToken cancellationToken = default)
    {
        var subject = "You're invited to CareFlow HMS";

        var body = _templateService.RenderStaffInvitation(
            fullName: fullName,
            username: username,
            role: role,
            activationUrl: activationUrl,
            expiryTime: expiryTime);

        return await DeliverAndLogEmailAsync(email, subject, body, "StaffInvitationEmail", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendStaffApprovalEmailAsync(string email, string fullName, string roleName, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var baseUrl = !string.IsNullOrWhiteSpace(_smtpSettings.FrontendBaseUrl) ? _smtpSettings.FrontendBaseUrl : "http://localhost:5173";
        var loginUrl = $"{baseUrl}/login";
        var subject = "Your CareFlow HMS account is approved";

        var body = _templateService.RenderAccountApproved(
            fullName: fullName,
            role: roleName,
            loginUrl: loginUrl);

        return await DeliverAndLogEmailAsync(email, subject, body, "AccountApprovedEmail", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendStaffRejectionEmailAsync(string email, string fullName, string reason, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var contactUrl = !string.IsNullOrWhiteSpace(_smtpSettings.SupportUrl) ? _smtpSettings.SupportUrl : "http://localhost:5173/contact";
        var subject = "Update on your CareFlow HMS application";

        var body = _templateService.RenderAccountRejected(
            fullName: fullName,
            reason: reason,
            contactUrl: contactUrl);

        return await DeliverAndLogEmailAsync(email, subject, body, "AccountRejectedEmail", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendAccountDeactivatedEmailAsync(string email, string fullName, string reason, CancellationToken cancellationToken = default)
    {
        var contactUrl = !string.IsNullOrWhiteSpace(_smtpSettings.SupportUrl) ? _smtpSettings.SupportUrl : "http://localhost:5173/contact";
        var subject = "Your CareFlow HMS account status changed";

        var body = _templateService.RenderAccountDeactivated(
            fullName: fullName,
            reason: reason,
            contactUrl: contactUrl);

        return await DeliverAndLogEmailAsync(email, subject, body, "AccountDeactivatedEmail", null, cancellationToken);
    }

    public async Task<EmailLog> SendAppointmentConfirmationEmailAsync(
        string email,
        string patientName,
        string appointmentDate,
        string doctorName,
        string department,
        string location,
        string referenceNumber,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = !string.IsNullOrWhiteSpace(_smtpSettings.FrontendBaseUrl) ? _smtpSettings.FrontendBaseUrl : "http://localhost:5173";
        var detailsUrl = $"{baseUrl}/appointments";
        var subject = "Your appointment is confirmed";

        var body = _templateService.RenderAppointmentConfirmation(
            patientName: patientName,
            appointmentDate: appointmentDate,
            doctorName: doctorName,
            department: department,
            location: location,
            referenceNumber: referenceNumber,
            detailsUrl: detailsUrl);

        return await DeliverAndLogEmailAsync(email, subject, body, "AppointmentConfirmationEmail", null, cancellationToken);
    }

    public async Task<EmailLog> SendAppointmentReminderEmailAsync(
        string email,
        string patientName,
        string appointmentDate,
        string doctorName,
        string department,
        string location,
        string referenceNumber,
        CancellationToken cancellationToken = default)
    {
        var baseUrl = !string.IsNullOrWhiteSpace(_smtpSettings.FrontendBaseUrl) ? _smtpSettings.FrontendBaseUrl : "http://localhost:5173";
        var detailsUrl = $"{baseUrl}/appointments";
        var subject = "Reminder: Upcoming appointment";

        var body = _templateService.RenderAppointmentReminder(
            patientName: patientName,
            appointmentDate: appointmentDate,
            doctorName: doctorName,
            department: department,
            location: location,
            referenceNumber: referenceNumber,
            detailsUrl: detailsUrl);

        return await DeliverAndLogEmailAsync(email, subject, body, "AppointmentReminderEmail", null, cancellationToken);
    }

    public async Task<EmailLog> SendRegistrationConfirmationEmailAsync(string email, string fullName, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var subject = "CareFlow HMS - Staff Registration Request Received";
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = fullName,
            ["Username"] = email,
            ["Role"] = "Pending Review",
            ["ActivationUrl"] = "#",
            ["ExpiryTime"] = "N/A"
        };

        // Reuse clean staff invitation structure for registration receipt
        var body = $@"
<!DOCTYPE html PUBLIC ""-//W3C//DTD XHTML 1.0 Transitional//EN"" ""http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"">
<html xmlns=""http://www.w3.org/1999/xhtml"" lang=""en"">
<head>
  <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"" />
  <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>CareFlow HMS</title>
</head>
<body style='margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;'>
  <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background:#f4f7fb;'>
    <tr>
      <td align='center' style='padding:32px 12px;'>
        <table role='presentation' width='600' cellspacing='0' cellpadding='0' border='0' style='width:100%;max-width:600px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;'>
          <tr>
            <td align='center' style='background:#10233f;padding:28px 20px;'>
              <h1 style='margin:0;color:#ffffff;font-size:26px;'>CareFlow HMS</h1>
              <p style='margin:8px 0 0;color:#cbd5e1;font-size:13px;text-transform:uppercase;'>Hospital Management System</p>
            </td>
          </tr>
          <tr>
            <td style='padding:32px 28px;'>
              <h2 style='margin:0 0 18px;font-size:22px;color:#172554;'>Registration Pending Administrator Review</h2>
              <p style='font-size:15px;line-height:1.7;color:#1e293b;'>Dear <strong>{WebUtility.HtmlEncode(fullName)}</strong>,</p>
              <p style='font-size:15px;line-height:1.7;color:#475569;'>Thank you for submitting your staff registration for CareFlow Hospital Management System.</p>
              <div style='background:#f1f5f9;border-left:4px solid #2563eb;padding:14px 18px;border-radius:4px;margin:20px 0;'>
                <p style='margin:0;font-size:14px;color:#1e293b;line-height:1.6;'>
                  Your application is currently <strong>PENDING REVIEW</strong> by hospital administration. In compliance with clinical RBAC standards, staff access requires verified authorization.
                </p>
              </div>
              <p style='font-size:14px;line-height:1.6;color:#64748b;'>You will receive an automated email notification as soon as your account request is processed.</p>
            </td>
          </tr>
          <tr>
            <td align='center' style='background:#f8fafc;padding:22px;border-top:1px solid #e2e8f0;'>
              <p style='margin:0 0 6px;font-size:13px;font-weight:bold;color:#475569;'>CareFlow HMS | Secure Healthcare Management</p>
              <p style='margin:0;font-size:12px;color:#64748b;'>This is an automated message. Please do not reply directly.</p>
              <p style='margin:10px 0 0;font-size:12px;color:#94a3b8;'>&copy; {DateTime.UtcNow.Year} CareFlow HMS</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        return await DeliverAndLogEmailAsync(email, subject, body, "RegistrationConfirmationEmail", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendAdminRegistrationAlertEmailAsync(string adminEmail, string applicantName, string applicantRole, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var subject = $"CareFlow HMS Alert: New Staff Approval Request - {applicantName}";
        var body = $@"
<!DOCTYPE html PUBLIC ""-//W3C//DTD XHTML 1.0 Transitional//EN"" ""http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"">
<html xmlns=""http://www.w3.org/1999/xhtml"" lang=""en"">
<head>
  <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"" />
  <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>CareFlow HMS</title>
</head>
<body style='margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;'>
  <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background:#f4f7fb;'>
    <tr>
      <td align='center' style='padding:32px 12px;'>
        <table role='presentation' width='600' cellspacing='0' cellpadding='0' border='0' style='width:100%;max-width:600px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;'>
          <tr>
            <td align='center' style='background:#10233f;padding:28px 20px;'>
              <h1 style='margin:0;color:#ffffff;font-size:26px;'>CareFlow HMS</h1>
              <p style='margin:8px 0 0;color:#cbd5e1;font-size:13px;text-transform:uppercase;'>Hospital Management System</p>
            </td>
          </tr>
          <tr>
            <td style='padding:32px 28px;'>
              <h2 style='margin:0 0 18px;font-size:22px;color:#172554;'>New Staff Onboarding Approval Request</h2>
              <p style='font-size:15px;line-height:1.7;color:#1e293b;'>A new staff registration application requires administrative review:</p>
              <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0 24px;'>
                <tr>
                  <td style='padding:16px 20px;'>
                    <p style='margin:0 0 8px;font-size:14px;'><strong>Applicant:</strong> {WebUtility.HtmlEncode(applicantName)}</p>
                    <p style='margin:0;font-size:14px;'><strong>Requested Role:</strong> {WebUtility.HtmlEncode(applicantRole)}</p>
                  </td>
                </tr>
              </table>
              <p style='font-size:14px;line-height:1.6;color:#475569;'>Please log in to the CareFlow Admin Portal under <strong>Staff Registration &gt; Requests</strong> to approve or reject this submission.</p>
            </td>
          </tr>
          <tr>
            <td align='center' style='background:#f8fafc;padding:22px;border-top:1px solid #e2e8f0;'>
              <p style='margin:0 0 6px;font-size:13px;font-weight:bold;color:#475569;'>CareFlow HMS | Secure Healthcare Management</p>
              <p style='margin:0;font-size:12px;color:#64748b;'>This is an automated message. Please do not reply directly.</p>
              <p style='margin:10px 0 0;font-size:12px;color:#94a3b8;'>&copy; {DateTime.UtcNow.Year} CareFlow HMS</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        return await DeliverAndLogEmailAsync(adminEmail, subject, body, "AdminRegistrationAlertEmail", requestId, cancellationToken);
    }

    private async Task<EmailLog> DeliverAndLogEmailAsync(string toEmail, string subject, string bodyHtml, string templateName, int? requestId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("EMAIL DISPATCH: Sending template '{TemplateName}' to '{ToEmail}'", templateName, toEmail);

        var log = new EmailLog
        {
            StaffRegistrationRequestId = requestId,
            RecipientEmail = toEmail,
            Subject = subject,
            TemplateName = templateName,
            Status = EmailDeliveryStatus.Sent,
            SentAt = DateTime.UtcNow,
            Attempts = 1
        };

        if (!_smtpSettings.EnableRealDelivery || string.IsNullOrWhiteSpace(_smtpSettings.Server))
        {
            _logger.LogInformation("LOCAL/SIMULATION EMAIL DISPATCH (EnableRealDelivery=False):\nTo: {To}\nSubject: {Subject}\nTemplate: {Template}", toEmail, subject, templateName);
            log.Status = EmailDeliveryStatus.Sent;
        }
        else
        {
            try
            {
                using var message = new MailMessage();
                message.From = new MailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName);
                message.To.Add(new MailAddress(toEmail));
                message.Subject = subject;
                message.Body = bodyHtml;
                message.IsBodyHtml = true;

                using var smtp = new SmtpClient(_smtpSettings.Server, _smtpSettings.Port);
                if (!string.IsNullOrWhiteSpace(_smtpSettings.Username))
                {
                    smtp.Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password);
                }
                smtp.EnableSsl = _smtpSettings.EnableSsl;

                await smtp.SendMailAsync(message, cancellationToken);
                _logger.LogInformation("EMAIL DELIVERED SUCCESSFULLY to '{ToEmail}' via SMTP server '{Server}:{Port}'", toEmail, _smtpSettings.Server, _smtpSettings.Port);
                log.Status = EmailDeliveryStatus.Sent;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SMTP Email delivery failed for '{ToEmail}'. Recording FAILED status.", toEmail);
                log.Status = EmailDeliveryStatus.Failed;
                log.ErrorMessage = ex.Message;
            }
        }

        // Persist EmailLog entity via repository scope
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            await userRepo.SaveEmailLogAsync(log, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist EmailLog entry to database.");
        }

        return log;
    }
}
