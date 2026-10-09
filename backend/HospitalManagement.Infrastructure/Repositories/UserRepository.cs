using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HospitalManagement.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly HospitalDbContext _context;

    public UserRepository(HospitalDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive, cancellationToken);
    }

    public async Task<User?> GetByEmailOrUsernameAsync(string identifier, CancellationToken cancellationToken = default)
    {
        var normalized = identifier.Trim().ToLower();
        return await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => (u.Username.ToLower() == normalized || u.Email.ToLower() == normalized) && u.IsActive, cancellationToken);
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.IsActive, cancellationToken);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return await _context.Users.AnyAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public async Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var normalized = username.Trim().ToLower();
        return await _context.Users.AnyAsync(u => u.Username.ToLower() == normalized, cancellationToken);
    }

    public async Task<Role?> GetRoleByIdOrNameAsync(int? roleId, string? roleName, CancellationToken cancellationToken = default)
    {
        var query = _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .AsNoTracking();

        if (roleId.HasValue && roleId.Value > 0)
        {
            var role = await query.FirstOrDefaultAsync(r => r.RoleId == roleId.Value, cancellationToken);
            if (role is not null) return role;
        }

        if (!string.IsNullOrWhiteSpace(roleName))
        {
            var normalized = roleName.Trim().ToLower();
            return await query.FirstOrDefaultAsync(r => r.Name.ToLower() == normalized, cancellationToken);
        }

        return await query.FirstOrDefaultAsync(r => r.Name == "Receptionist", cancellationToken);
    }

    public async Task<IEnumerable<Role>> GetActiveRolesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .AsNoTracking()
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.Level)
            .ToListAsync(cancellationToken);
    }

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<InvitationCode?> GetInvitationByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var normalized = code.Trim();
        return await _context.InvitationCodes
            .Include(i => i.TargetRole)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(i => i.Code.ToLower() == normalized.ToLower(), cancellationToken);
    }

    public async Task MarkInvitationAsUsedAsync(int invitationCodeId, int userId, CancellationToken cancellationToken = default)
    {
        var invitation = await _context.InvitationCodes.FindAsync(new object[] { invitationCodeId }, cancellationToken);
        if (invitation != null)
        {
            invitation.IsUsed = true;
            invitation.UsedAt = DateTime.UtcNow;
            invitation.UsedByUserId = userId;
            _context.InvitationCodes.Update(invitation);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    // Password Reset Token Methods
    public async Task SavePasswordResetTokenAsync(PasswordResetToken resetToken, CancellationToken cancellationToken = default)
    {
        await _context.PasswordResetTokens.AddAsync(resetToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PasswordResetToken?> GetValidPasswordResetTokenAsync(string email, string tokenHash, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLower();
        return await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Email.ToLower() == normalizedEmail &&
                                      t.TokenHash == tokenHash &&
                                      !t.IsUsed &&
                                      t.ExpiresAt > DateTime.UtcNow, cancellationToken);
    }

    public async Task MarkPasswordResetTokenAsUsedAsync(int resetTokenId, CancellationToken cancellationToken = default)
    {
        var token = await _context.PasswordResetTokens.FindAsync(new object[] { resetTokenId }, cancellationToken);
        if (token != null)
        {
            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;
            _context.PasswordResetTokens.Update(token);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    // Staff Registration Request Methods
    public async Task<StaffRegistrationRequest> AddStaffRegistrationRequestAsync(StaffRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        await _context.StaffRegistrationRequests.AddAsync(request, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task<StaffRegistrationRequest?> GetStaffRegistrationRequestByIdAsync(int requestId, CancellationToken cancellationToken = default)
    {
        return await _context.StaffRegistrationRequests
            .Include(s => s.Department)
            .Include(s => s.RequestedRole)
            .Include(s => s.ReviewedByUser)
            .FirstOrDefaultAsync(s => s.StaffRegistrationRequestId == requestId, cancellationToken);
    }

    public async Task<StaffRegistrationRequest?> GetStaffRegistrationRequestByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return await _context.StaffRegistrationRequests
            .Include(s => s.Department)
            .Include(s => s.RequestedRole)
            .Include(s => s.ReviewedByUser)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(s => s.Email.ToLower() == normalized, cancellationToken);
    }

    public async Task<IEnumerable<StaffRegistrationRequest>> GetStaffRegistrationRequestsAsync(RegistrationStatus? status, CancellationToken cancellationToken = default)
    {
        var query = _context.StaffRegistrationRequests
            .Include(s => s.Department)
            .Include(s => s.RequestedRole)
            .Include(s => s.ReviewedByUser)
            .AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        return await query.OrderByDescending(s => s.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task UpdateStaffRegistrationRequestAsync(StaffRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        _context.StaffRegistrationRequests.Update(request);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsPendingStaffRequestByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return await _context.StaffRegistrationRequests
            .AnyAsync(s => s.Email.ToLower() == normalized && s.Status == RegistrationStatus.Pending, cancellationToken);
    }

    // Email Logs & Delivery Tracking Methods
    public async Task<EmailLog> SaveEmailLogAsync(EmailLog emailLog, CancellationToken cancellationToken = default)
    {
        if (emailLog.EmailLogId == 0)
        {
            await _context.EmailLogs.AddAsync(emailLog, cancellationToken);
        }
        else
        {
            _context.EmailLogs.Update(emailLog);
        }
        await _context.SaveChangesAsync(cancellationToken);
        return emailLog;
    }

    public async Task<EmailLog?> GetLatestEmailLogForStaffRequestAsync(int requestId, CancellationToken cancellationToken = default)
    {
        return await _context.EmailLogs
            .AsNoTracking()
            .Where(e => e.StaffRegistrationRequestId == requestId)
            .OrderByDescending(e => e.SentAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<EmailLog>> GetEmailLogsForStaffRequestAsync(int requestId, CancellationToken cancellationToken = default)
    {
        return await _context.EmailLogs
            .AsNoTracking()
            .Where(e => e.StaffRegistrationRequestId == requestId)
            .OrderByDescending(e => e.SentAt)
            .ToListAsync(cancellationToken);
    }
}
