using HospitalManagement.Application.Doctors.Interfaces;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HospitalManagement.Infrastructure.Repositories;

public class DoctorRepository : IDoctorRepository
{
    private readonly HospitalDbContext _context;

    public DoctorRepository(HospitalDbContext context)
    {
        _context = context;
    }

    public async Task<Doctor?> GetByIdAsync(int doctorId, CancellationToken cancellationToken = default)
    {
        return await _context.Doctors
            .Include(d => d.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DoctorId == doctorId && d.IsActive, cancellationToken);
    }

    public async Task<IEnumerable<Doctor>> GetAllAsync(int? departmentId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Doctors
            .Include(d => d.Department)
            .AsNoTracking()
            .Where(d => d.IsActive);

        if (departmentId.HasValue)
        {
            query = query.Where(d => d.DepartmentId == departmentId.Value);
        }

        return await query.OrderBy(d => d.FirstName).ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Department>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .Include(d => d.Doctors)
            .AsNoTracking()
            .Where(d => d.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<Doctor> AddAsync(Doctor doctor, CancellationToken cancellationToken = default)
    {
        await _context.Doctors.AddAsync(doctor, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return doctor;
    }

    public async Task UpdateAsync(Doctor doctor, CancellationToken cancellationToken = default)
    {
        _context.Doctors.Update(doctor);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
