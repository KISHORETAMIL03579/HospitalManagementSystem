using HospitalManagement.Application.Appointments.DTOs;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Appointments.Services;

public interface IAppointmentService
{
    Task<IEnumerable<AppointmentDto>> GetAppointmentsAsync(int? patientId = null, int? doctorId = null, DateTime? date = null, CancellationToken cancellationToken = default);
    Task<AppointmentDto?> GetAppointmentByIdAsync(int appointmentId, CancellationToken cancellationToken = default);
    Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentRequest request, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(int appointmentId, AppointmentStatus status, string? notes = null, CancellationToken cancellationToken = default);
}
