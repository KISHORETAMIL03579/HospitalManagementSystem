namespace HospitalManagement.Application.Auth.DTOs;

public class UpdateStaffRegistrationRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? EmployeeId { get; set; }
    public int? RequestedRoleId { get; set; }
    public int? DepartmentId { get; set; }
    public int? Status { get; set; }
    public string? RejectionReason { get; set; }
}
