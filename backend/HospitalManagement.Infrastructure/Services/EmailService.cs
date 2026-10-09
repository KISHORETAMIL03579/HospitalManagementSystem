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
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<SmtpSettings> smtpSettings,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailService> logger)
    {
        _smtpSettings = smtpSettings.Value;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<EmailLog> SendPasswordResetEmailAsync(string email, string resetToken, CancellationToken cancellationToken = default)
    {
        var resetUrl = $"http://localhost:5173/reset-password?token={resetToken}&email={Uri.EscapeDataString(email)}";
        var subject = "CareFlow HMS - Security Password Reset Request";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                <h2 style='color: #2563eb;'>CareFlow HMS</h2>
                <h3>Password Reset Request</h3>
                <p>Hello,</p>
                <p>We received a request to reset the password for your CareFlow Hospital Management System account (<strong>{email}</strong>).</p>
                <p>Please click the secure button below to choose a new password. This link is single-use and expires in 30 minutes:</p>
                <p style='margin: 25px 0;'>
                    <a href='{resetUrl}' style='background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Reset Password</a>
                </p>
                <p style='font-size: 12px; color: #64748b;'>Or copy and paste this link into your browser: <br><a href='{resetUrl}'>{resetUrl}</a></p>
                <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                <p style='font-size: 11px; color: #94a3b8;'>If you did not request a password reset, please ignore this email or contact your hospital system administrator immediately.</p>
            </div>";

        return await DeliverAndLogEmailAsync(email, subject, body, "PasswordReset", null, cancellationToken);
    }

    public async Task<EmailLog> SendRegistrationConfirmationEmailAsync(string email, string fullName, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var subject = "CareFlow HMS - Staff Registration Request Received";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                <h2 style='color: #2563eb;'>CareFlow HMS</h2>
                <h3>Registration Pending Administrator Review</h3>
                <p>Dear {fullName},</p>
                <p>Thank you for submitting your staff registration for CareFlow Hospital Management System.</p>
                <p>Your request is currently <strong>PENDING REVIEW</strong> by a hospital administrator. In compliance with hospital RBAC security standards, clinical account access requires administrative approval.</p>
                <p>You will receive an email notification once your account request has been reviewed and authorized.</p>
            </div>";

        return await DeliverAndLogEmailAsync(email, subject, body, "RegistrationConfirmation", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendAdminRegistrationAlertEmailAsync(string adminEmail, string applicantName, string applicantRole, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var subject = $"CareFlow HMS Alert: New Staff Approval Request - {applicantName}";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                <h2 style='color: #2563eb;'>CareFlow HMS</h2>
                <h3>New Staff Onboarding Approval Request</h3>
                <p>A new staff registration request has been submitted requiring your administrative review:</p>
                <ul>
                    <li><strong>Applicant:</strong> {applicantName}</li>
                    <li><strong>Requested Role:</strong> {applicantRole}</li>
                </ul>
                <p>Please log in to the CareFlow Admin Portal under <strong>Staff Approvals</strong> to review and process this request.</p>
            </div>";

        return await DeliverAndLogEmailAsync(adminEmail, subject, body, "AdminRegistrationAlert", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendStaffApprovalEmailAsync(string email, string fullName, string roleName, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var loginUrl = "http://localhost:5173/login";
        var subject = "CareFlow HMS - Staff Account Approved & Activated";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                <h2 style='color: #2563eb;'>CareFlow HMS</h2>
                <h3 style='color: #16a34a;'>Account Approved & Activated!</h3>
                <p>Dear {fullName},</p>
                <p>We are pleased to inform you that your staff registration request has been <strong>APPROVED</strong> by the hospital administrator.</p>
                <p>Your account has been activated with authorized role: <strong>{roleName}</strong>.</p>
                <p style='margin: 25px 0;'>
                    <a href='{loginUrl}' style='background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Sign In to Workspace</a>
                </p>
            </div>";

        return await DeliverAndLogEmailAsync(email, subject, body, "StaffApproval", requestId, cancellationToken);
    }

    public async Task<EmailLog> SendStaffRejectionEmailAsync(string email, string fullName, string reason, int? requestId = null, CancellationToken cancellationToken = default)
    {
        var subject = "CareFlow HMS - Staff Registration Request Update";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                <h2 style='color: #2563eb;'>CareFlow HMS</h2>
                <h3>Staff Registration Request Status Update</h3>
                <p>Dear {fullName},</p>
                <p>Your staff registration request for CareFlow HMS was reviewed by the hospital administration.</p>
                <p>Status: <strong style='color: #dc2626;'>REJECTED</strong></p>
                <p>Reason provided: <em>{reason}</em></p>
                <p>If you believe this is an error, please contact your hospital system administrator directly.</p>
            </div>";

        return await DeliverAndLogEmailAsync(email, subject, body, "StaffRejection", requestId, cancellationToken);
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
            _logger.LogInformation("LOCAL/SIMULATION EMAIL DISPATCH (EnableRealDelivery=False):\nTo: {To}\nSubject: {Subject}", toEmail, subject);
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
