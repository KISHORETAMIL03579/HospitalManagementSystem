using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Doctors.Interfaces;

public interface IDoctorRepository
{
    Task<Doctor?> GetByIdAsync(int doctorId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Doctor>> GetAllAsync(int? departmentId = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<Department>> GetDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<Doctor> AddAsync(Doctor doctor, CancellationToken cancellationToken = default);
    Task UpdateAsync(Doctor doctor, CancellationToken cancellationToken = default);
}
