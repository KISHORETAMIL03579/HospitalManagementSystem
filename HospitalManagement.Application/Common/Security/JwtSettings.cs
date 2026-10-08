namespace HospitalManagement.Application.Common.Security;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";
    public string Secret { get; set; } = "CareFlow_Super_Secret_JWT_Signing_Key_2026_Minimum_32_Bytes!";
    public string Issuer { get; set; } = "CareFlowHMS";
    public string Audience { get; set; } = "CareFlowHMSClient";
    public int ExpiryMinutes { get; set; } = 120; // 2 hours
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
