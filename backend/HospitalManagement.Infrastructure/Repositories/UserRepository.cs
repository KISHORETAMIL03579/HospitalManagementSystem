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
}
