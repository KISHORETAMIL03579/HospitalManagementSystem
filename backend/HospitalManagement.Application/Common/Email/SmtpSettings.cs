namespace HospitalManagement.Application.Common.Email;

public class SmtpSettings
{
    public string Server { get; set; } = "smtp.careflow.com";
    public int Port { get; set; } = 587;
    public string SenderName { get; set; } = "CareFlow HMS Security";
    public string SenderEmail { get; set; } = "noreply@careflow.com";
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public bool EnableSsl { get; set; } = true;
    public bool EnableRealDelivery { get; set; } = false;
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
    public string SupportEmail { get; set; } = "support@careflow.com";
    public string SupportUrl { get; set; } = "http://localhost:5173/contact";
}
