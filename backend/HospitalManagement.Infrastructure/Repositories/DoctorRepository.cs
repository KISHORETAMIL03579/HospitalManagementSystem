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

    public async Task<IEnumerable<DoctorSchedule>> GetSchedulesAsync(int doctorId, CancellationToken cancellationToken = default)
    {
        return await _context.DoctorSchedules
            .AsNoTracking()
            .Where(s => s.DoctorId == doctorId && s.IsActive)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task SaveSchedulesAsync(int doctorId, IEnumerable<DoctorSchedule> schedules, CancellationToken cancellationToken = default)
    {
        var existing = await _context.DoctorSchedules
            .Where(s => s.DoctorId == doctorId)
            .ToListAsync(cancellationToken);

        _context.DoctorSchedules.RemoveRange(existing);
        await _context.DoctorSchedules.AddRangeAsync(schedules, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<DoctorScheduleException>> GetExceptionsAsync(int doctorId, DateOnly? fromDate = null, DateOnly? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.DoctorScheduleExceptions
            .AsNoTracking()
            .Where(e => e.DoctorId == doctorId && e.IsActive);

        if (fromDate.HasValue)
        {
            query = query.Where(e => e.Date >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(e => e.Date <= toDate.Value);
        }

        return await query
            .OrderBy(e => e.Date)
            .ThenBy(e => e.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<DoctorScheduleException?> GetExceptionByIdAsync(int exceptionId, CancellationToken cancellationToken = default)
    {
        return await _context.DoctorScheduleExceptions
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ExceptionId == exceptionId && e.IsActive, cancellationToken);
    }

    public async Task<DoctorScheduleException> AddExceptionAsync(DoctorScheduleException exception, CancellationToken cancellationToken = default)
    {
        await _context.DoctorScheduleExceptions.AddAsync(exception, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return exception;
    }

    public async Task DeleteExceptionAsync(int exceptionId, CancellationToken cancellationToken = default)
    {
        var ex = await _context.DoctorScheduleExceptions
            .FirstOrDefaultAsync(e => e.ExceptionId == exceptionId, cancellationToken);

        if (ex is not null)
        {
            _context.DoctorScheduleExceptions.Remove(ex);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
