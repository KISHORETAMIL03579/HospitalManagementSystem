using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Appointments.Interfaces;

public interface IAppointmentRepository
{
    Task<Appointment?> GetByIdAsync(int appointmentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Appointment>> GetFilteredAsync(int? patientId = null, int? doctorId = null, DateTime? date = null, CancellationToken cancellationToken = default);
    Task<bool> IsSlotBookedAsync(int doctorId, DateTime date, TimeSpan timeSlot, CancellationToken cancellationToken = default);
    Task<Appointment> AddAsync(Appointment appointment, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(int appointmentId, AppointmentStatus status, string? notes = null, CancellationToken cancellationToken = default);
}
