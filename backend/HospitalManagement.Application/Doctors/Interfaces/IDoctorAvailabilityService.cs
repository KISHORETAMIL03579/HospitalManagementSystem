using HospitalManagement.Application.Doctors.DTOs;

namespace HospitalManagement.Application.Doctors.Interfaces;

public interface IDoctorAvailabilityService
{
    Task<DoctorAvailabilityDto> GetDoctorAvailabilityAsync(int doctorId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IEnumerable<DoctorDirectoryItemDto>> GetDoctorDirectoryAsync(int? departmentId = null, string? search = null, DateOnly? targetDate = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<DoctorScheduleDto>> GetDoctorSchedulesAsync(int doctorId, CancellationToken cancellationToken = default);
    Task<IEnumerable<DoctorScheduleDto>> SaveDoctorSchedulesAsync(int doctorId, IEnumerable<SaveDoctorScheduleDto> schedules, CancellationToken cancellationToken = default);
    Task<IEnumerable<DoctorScheduleExceptionDto>> GetDoctorExceptionsAsync(int doctorId, DateOnly? fromDate = null, DateOnly? toDate = null, CancellationToken cancellationToken = default);
    Task<ConflictCheckResultDto> CheckExceptionConflictsAsync(int doctorId, CreateDoctorScheduleExceptionDto dto, CancellationToken cancellationToken = default);
    Task<DoctorScheduleExceptionDto> CreateExceptionAsync(int doctorId, CreateDoctorScheduleExceptionDto dto, CancellationToken cancellationToken = default);
    Task DeleteExceptionAsync(int doctorId, int exceptionId, CancellationToken cancellationToken = default);
}
