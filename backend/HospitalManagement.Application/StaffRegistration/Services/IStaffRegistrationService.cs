using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.StaffRegistration.Services;

public interface IStaffRegistrationService
{
    Task<StaffRegistrationRequestDto> SubmitStaffRegistrationRequestAsync(SubmitStaffRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto?> GetStaffRegistrationStatusAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<StaffRegistrationRequestDto>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status = null, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> ApproveStaffRegistrationRequestAsync(int requestId, int adminUserId, ApproveStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> RejectStaffRegistrationRequestAsync(int requestId, int adminUserId, RejectStaffRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequestDto> RetryStaffNotificationEmailAsync(int requestId, CancellationToken cancellationToken = default);
}
