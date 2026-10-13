using System.Collections.Concurrent;
using System.Net;
using System.Reflection;
using HospitalManagement.Application.Common.Email;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Infrastructure.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private static readonly ConcurrentDictionary<string, string> TemplateCache = new();
    private readonly ILogger<EmailTemplateService> _logger;

    public EmailTemplateService(ILogger<EmailTemplateService> logger)
    {
        _logger = logger;
    }

    public string RenderTemplate(string templateName, IDictionary<string, string> placeholders)
    {
        var rawHtml = GetTemplateContent(templateName);

        // Always provide Year fallback
        if (!placeholders.ContainsKey("Year"))
        {
            placeholders["Year"] = DateTime.UtcNow.Year.ToString();
        }

        var result = rawHtml;
        foreach (var (key, value) in placeholders)
        {
            var placeholder = "{{" + key + "}}";
            string safeValue;

            if (key.EndsWith("Url", StringComparison.OrdinalIgnoreCase) ||
                key.EndsWith("Link", StringComparison.OrdinalIgnoreCase))
            {
                // URLs should be sanitized against quote-breaking attributes while keeping slashes and query strings intact
                safeValue = SanitizeUrl(value);
            }
            else
            {
                // Standard text placeholders are strictly HTML-encoded against XSS
                safeValue = WebUtility.HtmlEncode(value ?? string.Empty);
            }

            result = result.Replace(placeholder, safeValue);
        }

        return result;
    }

    public string RenderStaffInvitation(string fullName, string username, string role, string activationUrl, string expiryTime)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = fullName,
            ["Username"] = username,
            ["Role"] = role,
            ["ActivationUrl"] = activationUrl,
            ["ExpiryTime"] = expiryTime
        };

        return RenderTemplate("StaffInvitationEmail", placeholders);
    }

    public string RenderAccountApproved(string fullName, string role, string loginUrl)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = fullName,
            ["Role"] = role,
            ["LoginUrl"] = loginUrl
        };

        return RenderTemplate("AccountApprovedEmail", placeholders);
    }

    public string RenderAccountRejected(string fullName, string reason, string contactUrl)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = fullName,
            ["Reason"] = string.IsNullOrWhiteSpace(reason) ? "Application does not meet current departmental requirements." : reason,
            ["ContactUrl"] = contactUrl
        };

        return RenderTemplate("AccountRejectedEmail", placeholders);
    }

    public string RenderPasswordReset(string fullName, string email, string resetUrl, int expiryMinutes)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = string.IsNullOrWhiteSpace(fullName) ? "CareFlow User" : fullName,
            ["Email"] = email,
            ["ResetUrl"] = resetUrl,
            ["ExpiryMinutes"] = expiryMinutes.ToString()
        };

        return RenderTemplate("PasswordResetEmail", placeholders);
    }

    public string RenderPasswordChanged(string fullName, string timestamp, string secureAccountUrl)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = string.IsNullOrWhiteSpace(fullName) ? "CareFlow User" : fullName,
            ["Timestamp"] = timestamp,
            ["SecureAccountUrl"] = secureAccountUrl
        };

        return RenderTemplate("PasswordChangedEmail", placeholders);
    }

    public string RenderAppointmentConfirmation(string patientName, string appointmentDate, string doctorName, string department, string location, string referenceNumber, string detailsUrl)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["PatientName"] = patientName,
            ["AppointmentDate"] = appointmentDate,
            ["DoctorName"] = doctorName,
            ["Department"] = department,
            ["Location"] = location,
            ["ReferenceNumber"] = referenceNumber,
            ["DetailsUrl"] = detailsUrl
        };

        return RenderTemplate("AppointmentConfirmationEmail", placeholders);
    }

    public string RenderAppointmentReminder(string patientName, string appointmentDate, string doctorName, string department, string location, string referenceNumber, string detailsUrl)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["PatientName"] = patientName,
            ["AppointmentDate"] = appointmentDate,
            ["DoctorName"] = doctorName,
            ["Department"] = department,
            ["Location"] = location,
            ["ReferenceNumber"] = referenceNumber,
            ["DetailsUrl"] = detailsUrl
        };

        return RenderTemplate("AppointmentReminderEmail", placeholders);
    }

    public string RenderAccountDeactivated(string fullName, string reason, string contactUrl)
    {
        var placeholders = new Dictionary<string, string>
        {
            ["FullName"] = fullName,
            ["Reason"] = string.IsNullOrWhiteSpace(reason) ? "Account access has been suspended per administrative policy." : reason,
            ["ContactUrl"] = contactUrl
        };

        return RenderTemplate("AccountDeactivatedEmail", placeholders);
    }

    private string GetTemplateContent(string templateName)
    {
        if (TemplateCache.TryGetValue(templateName, out var cachedContent))
        {
            return cachedContent;
        }

        // 1. Attempt to load from Embedded Resources in this assembly
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = $"HospitalManagement.Infrastructure.Templates.Emails.{templateName}.html";

        using (var stream = assembly.GetManifestResourceStream(resourceName))
        {
            if (stream != null)
            {
                using var reader = new StreamReader(stream);
                var content = reader.ReadToEnd();
                TemplateCache[templateName] = content;
                return content;
            }
        }

        // 2. Fallback to physical disk lookup
        var possiblePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Templates", "Emails", $"{templateName}.html"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "HospitalManagement.Infrastructure", "Templates", "Emails", $"{templateName}.html"),
            Path.Combine(Directory.GetCurrentDirectory(), "Templates", "Emails", $"{templateName}.html"),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "HospitalManagement.Infrastructure", "Templates", "Emails", $"{templateName}.html")
        };

        foreach (var path in possiblePaths)
        {
            if (File.Exists(path))
            {
                var content = File.ReadAllText(path);
                TemplateCache[templateName] = content;
                return content;
            }
        }

        _logger.LogError("Email template '{TemplateName}' could not be located in assembly or disk.", templateName);
        throw new FileNotFoundException($"Email template '{templateName}' was not found.");
    }

    private static string SanitizeUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return "#";
        // Protect against attribute injection in href="{{...}}"
        return url.Replace("\"", "%22").Replace("'", "%27").Replace("<", "%3C").Replace(">", "%3E");
    }
}
