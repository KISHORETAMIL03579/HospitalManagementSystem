using System.Net;
using HospitalManagement.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class EmailTemplateServiceTests
{
    private readonly EmailTemplateService _templateService;

    public EmailTemplateServiceTests()
    {
        var loggerMock = new Mock<ILogger<EmailTemplateService>>();
        _templateService = new EmailTemplateService(loggerMock.Object);
    }

    [Fact]
    public void RenderStaffInvitation_ShouldPopulateAllPlaceholders_AndContainBranding()
    {
        // Arrange
        var fullName = "Dr. Arun Kumar";
        var username = "arunkumar";
        var role = "Doctor";
        var activationUrl = "https://careflow.hospital/activate?token=abc123xyz";
        var expiryTime = "October 14, 2026, 12:00 PM UTC";

        // Act
        var html = _templateService.RenderStaffInvitation(fullName, username, role, activationUrl, expiryTime);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("CareFlow HMS", html);
        Assert.Contains("Hospital Management System", html);
        Assert.Contains("You're invited to CareFlow HMS", html);
        Assert.Contains(fullName, html);
        Assert.Contains(username, html);
        Assert.Contains(role, html);
        Assert.Contains(activationUrl, html);
        Assert.Contains(expiryTime, html);
        Assert.Contains("Activate Your Account", html);
        Assert.DoesNotContain("{{FullName}}", html);
        Assert.DoesNotContain("{{Username}}", html);
        Assert.DoesNotContain("{{Role}}", html);
        Assert.DoesNotContain("{{ActivationUrl}}", html);
        Assert.DoesNotContain("{{ExpiryTime}}", html);
        Assert.DoesNotContain("{{Year}}", html);
    }

    [Fact]
    public void RenderStaffInvitation_ShouldHtmlEncodeDynamicInputs_ToPreventXss()
    {
        // Arrange
        var maliciousName = "Dr. <script>alert('xss')</script> & Associates";
        var maliciousRole = "<b>Chief Surgeon</b>";
        var username = "admin\" onclick=\"evil()";
        var activationUrl = "https://careflow.hospital/activate?token=test";
        var expiryTime = "24 hours";

        // Act
        var html = _templateService.RenderStaffInvitation(maliciousName, username, maliciousRole, activationUrl, expiryTime);

        // Assert
        Assert.DoesNotContain("<script>", html);
        Assert.Contains("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt; &amp; Associates", html);
        Assert.DoesNotContain("<b>Chief Surgeon</b>", html);
        Assert.Contains("&lt;b&gt;Chief Surgeon&lt;/b&gt;", html);
    }

    [Fact]
    public void RenderAccountApproved_ShouldContainApprovalStatus_AndLoginLink()
    {
        // Arrange
        var fullName = "Nurse Priya Sharma";
        var role = "Nurse";
        var loginUrl = "https://careflow.hospital/login";

        // Act
        var html = _templateService.RenderAccountApproved(fullName, role, loginUrl);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("CareFlow HMS", html);
        Assert.Contains("Your CareFlow HMS account is approved", html);
        Assert.Contains(fullName, html);
        Assert.Contains(role, html);
        Assert.Contains(loginUrl, html);
        Assert.Contains("Sign In to CareFlow HMS", html);
        Assert.DoesNotContain("{{FullName}}", html);
        Assert.DoesNotContain("{{Role}}", html);
        Assert.DoesNotContain("{{LoginUrl}}", html);
    }

    [Fact]
    public void RenderAccountRejected_ShouldContainReason_AndContactAction()
    {
        // Arrange
        var fullName = "John Doe";
        var reason = "Incomplete medical license verification documents.";
        var contactUrl = "https://careflow.hospital/contact";

        // Act
        var html = _templateService.RenderAccountRejected(fullName, reason, contactUrl);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("CareFlow HMS", html);
        Assert.Contains("Update on your CareFlow HMS account request", html);
        Assert.Contains(fullName, html);
        Assert.Contains(reason, html);
        Assert.Contains(contactUrl, html);
        Assert.Contains("Contact Administrator", html);
        Assert.DoesNotContain("{{Reason}}", html);
    }

    [Fact]
    public void RenderPasswordReset_ShouldContainResetTokenUrl_AndExpiryNotice()
    {
        // Arrange
        var fullName = "Dr. Sarah Jenkins";
        var email = "sarah.j@careflow.com";
        var resetUrl = "https://careflow.hospital/reset-password?token=secret123";
        var expiryMinutes = 30;

        // Act
        var html = _templateService.RenderPasswordReset(fullName, email, resetUrl, expiryMinutes);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Reset your CareFlow HMS password", html);
        Assert.Contains(fullName, html);
        Assert.Contains(email, html);
        Assert.Contains(resetUrl, html);
        Assert.Contains("30 minutes", html);
        Assert.Contains("Reset Password", html);
        Assert.DoesNotContain("{{ResetUrl}}", html);
        Assert.DoesNotContain("{{ExpiryMinutes}}", html);
    }

    [Fact]
    public void RenderPasswordChanged_ShouldContainSecurityConfirmation()
    {
        // Arrange
        var fullName = "Dr. Michael Chen";
        var timestamp = "Oct 13, 2026 16:30 UTC";
        var secureUrl = "https://careflow.hospital/login";

        // Act
        var html = _templateService.RenderPasswordChanged(fullName, timestamp, secureUrl);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Your CareFlow HMS password was changed", html);
        Assert.Contains(fullName, html);
        Assert.Contains(timestamp, html);
        Assert.Contains("Secure My Account", html);
        Assert.Contains(secureUrl, html);
    }

    [Fact]
    public void RenderAppointmentConfirmation_ShouldContainClinicalDetails()
    {
        // Arrange
        var patientName = "Alice Morgan";
        var appointmentDate = "Friday, October 16, 2026 at 10:30 AM";
        var doctorName = "Dr. Emily Watson (Cardiologist)";
        var department = "Cardiology";
        var location = "Main Hospital, 3rd Floor, Suite 302";
        var refNumber = "CF-2026-90412";
        var detailsUrl = "https://careflow.hospital/appointments";

        // Act
        var html = _templateService.RenderAppointmentConfirmation(
            patientName, appointmentDate, doctorName, department, location, refNumber, detailsUrl);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Your appointment is confirmed", html);
        Assert.Contains(patientName, html);
        Assert.Contains(appointmentDate, html);
        Assert.Contains(doctorName, html);
        Assert.Contains(department, html);
        Assert.Contains(location, html);
        Assert.Contains(refNumber, html);
        Assert.Contains("View Appointment", html);
        Assert.DoesNotContain("{{PatientName}}", html);
        Assert.DoesNotContain("{{DoctorName}}", html);
    }

    [Fact]
    public void RenderAppointmentReminder_ShouldContainUpcomingNotice()
    {
        // Arrange
        var patientName = "Robert Taylor";
        var appointmentDate = "Tomorrow, 09:00 AM";
        var doctorName = "Dr. David Patel";
        var department = "Orthopedics";
        var location = "Building B, Room 104";
        var refNumber = "CF-2026-77821";
        var detailsUrl = "https://careflow.hospital/appointments";

        // Act
        var html = _templateService.RenderAppointmentReminder(
            patientName, appointmentDate, doctorName, department, location, refNumber, detailsUrl);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Reminder: Upcoming CareFlow HMS appointment", html);
        Assert.Contains(patientName, html);
        Assert.Contains(appointmentDate, html);
        Assert.Contains(doctorName, html);
        Assert.Contains("View Appointment", html);
    }

    [Fact]
    public void RenderAccountDeactivated_ShouldContainReasonAndSupportContact()
    {
        // Arrange
        var fullName = "Staff Member";
        var reason = "Employment term ended.";
        var contactUrl = "https://careflow.hospital/contact";

        // Act
        var html = _templateService.RenderAccountDeactivated(fullName, reason, contactUrl);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Your CareFlow HMS account status changed", html);
        Assert.Contains(fullName, html);
        Assert.Contains(reason, html);
        Assert.Contains("Contact Hospital Administration", html);
    }
}
