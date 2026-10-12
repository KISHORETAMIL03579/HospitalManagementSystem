using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Doctors.Interfaces;

public interface IDoctorRepository
{
    Task<Doctor?> GetByIdAsync(int doctorId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Doctor>> GetAllAsync(int? departmentId = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<Department>> GetDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<Doctor> AddAsync(Doctor doctor, CancellationToken cancellationToken = default);
    Task UpdateAsync(Doctor doctor, CancellationToken cancellationToken = default);
    Task<IEnumerable<DoctorSchedule>> GetSchedulesAsync(int doctorId, CancellationToken cancellationToken = default);
    Task SaveSchedulesAsync(int doctorId, IEnumerable<DoctorSchedule> schedules, CancellationToken cancellationToken = default);
    Task<IEnumerable<DoctorScheduleException>> GetExceptionsAsync(int doctorId, DateOnly? fromDate = null, DateOnly? toDate = null, CancellationToken cancellationToken = default);
    Task<DoctorScheduleException?> GetExceptionByIdAsync(int exceptionId, CancellationToken cancellationToken = default);
    Task<DoctorScheduleException> AddExceptionAsync(DoctorScheduleException exception, CancellationToken cancellationToken = default);
    Task DeleteExceptionAsync(int exceptionId, CancellationToken cancellationToken = default);
}
