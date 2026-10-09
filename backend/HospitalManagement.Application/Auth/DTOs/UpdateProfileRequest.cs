using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Auth.DTOs;

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public TimeFormat TimeFormat { get; set; } = TimeFormat.Hour12;
    public string TimeZone { get; set; } = "UTC";
    public string Language { get; set; } = "en-US";
}

