using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Auth.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<User?> GetTrackedByIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailOrUsernameAsync(string identifier, CancellationToken cancellationToken = default);
    Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<Role?> GetRoleByIdOrNameAsync(int? roleId, string? roleName, CancellationToken cancellationToken = default);
    Task<IEnumerable<Role>> GetActiveRolesAsync(CancellationToken cancellationToken = default);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);

    Task<InvitationCode?> GetInvitationByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task MarkInvitationAsUsedAsync(int invitationCodeId, int userId, CancellationToken cancellationToken = default);

    // Password Reset Tokens
    Task SavePasswordResetTokenAsync(PasswordResetToken resetToken, CancellationToken cancellationToken = default);
    Task<PasswordResetToken?> GetValidPasswordResetTokenAsync(string email, string tokenHash, CancellationToken cancellationToken = default);
    Task MarkPasswordResetTokenAsUsedAsync(int resetTokenId, CancellationToken cancellationToken = default);

    // Staff Registration Requests
    Task<StaffRegistrationRequest> AddStaffRegistrationRequestAsync(StaffRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequest?> GetStaffRegistrationRequestByIdAsync(int requestId, CancellationToken cancellationToken = default);
    Task<StaffRegistrationRequest?> GetStaffRegistrationRequestByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<StaffRegistrationRequest>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status, CancellationToken cancellationToken = default);
    Task UpdateStaffRegistrationRequestAsync(StaffRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<bool> ExistsPendingStaffRequestByEmailAsync(string email, CancellationToken cancellationToken = default);

    // Email Logs & Delivery Tracking
    Task<EmailLog> SaveEmailLogAsync(EmailLog emailLog, CancellationToken cancellationToken = default);
    Task<EmailLog?> GetLatestEmailLogForStaffRequestAsync(int requestId, CancellationToken cancellationToken = default);
    Task<IEnumerable<EmailLog>> GetEmailLogsForStaffRequestAsync(int requestId, CancellationToken cancellationToken = default);

    // Admin User Management
    Task<IEnumerable<User>> GetAllUsersAsync(string? search = null, int? roleId = null, bool? isActive = null, CancellationToken cancellationToken = default);
    Task<int> GetActiveAdminCountAsync(CancellationToken cancellationToken = default);
}
