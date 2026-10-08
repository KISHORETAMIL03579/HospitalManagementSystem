using HospitalManagement.Application.Appointments.Interfaces;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HospitalManagement.Infrastructure.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly HospitalDbContext _context;

    public AppointmentRepository(HospitalDbContext context)
    {
        _context = context;
    }

    public async Task<Appointment?> GetByIdAsync(int appointmentId, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId && a.IsActive, cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetFilteredAsync(int? patientId = null, int? doctorId = null, DateTime? date = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .AsNoTracking()
            .Where(a => a.IsActive);

        if (patientId.HasValue)
        {
            query = query.Where(a => a.PatientId == patientId.Value);
        }

        if (doctorId.HasValue)
        {
            query = query.Where(a => a.DoctorId == doctorId.Value);
        }

        if (date.HasValue)
        {
            query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);
        }

        return await query.OrderByDescending(a => a.AppointmentDate)
            .ThenBy(a => a.TimeSlot)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> IsSlotBookedAsync(int doctorId, DateTime date, TimeSpan timeSlot, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .AnyAsync(a => a.DoctorId == doctorId
                        && a.AppointmentDate.Date == date.Date
                        && a.TimeSlot == timeSlot
                        && a.Status != AppointmentStatus.Cancelled
                        && a.IsActive, cancellationToken);
    }

    public async Task<Appointment> AddAsync(Appointment appointment, CancellationToken cancellationToken = default)
    {
        await _context.Appointments.AddAsync(appointment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return appointment;
    }

    public async Task UpdateStatusAsync(int appointmentId, AppointmentStatus status, string? notes = null, CancellationToken cancellationToken = default)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.AppointmentId == appointmentId, cancellationToken);
        if (appointment is not null)
        {
            appointment.Status = status;
            if (!string.IsNullOrWhiteSpace(notes))
            {
                appointment.Notes = notes;
            }
            appointment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
