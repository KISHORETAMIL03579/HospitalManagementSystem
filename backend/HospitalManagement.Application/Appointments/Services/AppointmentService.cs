using FluentValidation;
using HospitalManagement.Application.Appointments.DTOs;
using HospitalManagement.Application.Appointments.Interfaces;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Appointments.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IValidator<CreateAppointmentRequest> _validator;

    public AppointmentService(IAppointmentRepository appointmentRepository, IValidator<CreateAppointmentRequest> validator)
    {
        _appointmentRepository = appointmentRepository;
        _validator = validator;
    }

    public async Task<IEnumerable<AppointmentDto>> GetAppointmentsAsync(int? patientId = null, int? doctorId = null, DateTime? date = null, CancellationToken cancellationToken = default)
    {
        var appointments = await _appointmentRepository.GetFilteredAsync(patientId, doctorId, date, cancellationToken);
        return appointments.Select(MapToDto);
    }

    public async Task<IEnumerable<AppointmentDto>> GetAppointmentsForUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var appointments = await _appointmentRepository.GetForUserAsync(userId, cancellationToken);
        return appointments.Select(MapToDto);
    }

    public async Task<AppointmentDto?> GetAppointmentByIdAsync(int appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(appointmentId, cancellationToken);
        return appointment is null ? null : MapToDto(appointment);
    }

    public async Task<AppointmentDto> CreateAppointmentAsync(CreateAppointmentRequest request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var timeSlot = TimeSpan.Parse(request.TimeSlot);

        if (await _appointmentRepository.IsSlotBookedAsync(request.DoctorId, request.AppointmentDate.Date, timeSlot, cancellationToken))
        {
            throw new InvalidOperationException($"The requested doctor is already booked at {request.TimeSlot} on {request.AppointmentDate:yyyy-MM-dd}.");
        }

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AppointmentDate = request.AppointmentDate.Date,
            TimeSlot = timeSlot,
            Status = AppointmentStatus.Confirmed,
            Reason = request.Reason.Trim(),
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var created = await _appointmentRepository.AddAsync(appointment, cancellationToken);
        var reloaded = await _appointmentRepository.GetByIdAsync(created.AppointmentId, cancellationToken);

        return MapToDto(reloaded ?? created);
    }

    public async Task UpdateStatusAsync(int appointmentId, AppointmentStatus status, string? notes = null, CancellationToken cancellationToken = default)
    {
        await _appointmentRepository.UpdateStatusAsync(appointmentId, status, notes, cancellationToken);
    }

    private static AppointmentDto MapToDto(Appointment a) => new()
    {
        AppointmentId = a.AppointmentId,
        PatientId = a.PatientId,
        PatientName = a.Patient?.FullName ?? "Unknown Patient",
        MedicalRecordNumber = a.Patient?.MedicalRecordNumber ?? "N/A",
        DoctorId = a.DoctorId,
        DoctorName = a.Doctor?.FullName ?? "Unknown Doctor",
        Specialization = a.Doctor?.Specialization ?? "General",
        AppointmentDate = a.AppointmentDate,
        TimeSlot = a.TimeSlot.ToString(@"hh\:mm"),
        Status = a.Status,
        Reason = a.Reason,
        Notes = a.Notes,
        CreatedAt = a.CreatedAt
    };
}
