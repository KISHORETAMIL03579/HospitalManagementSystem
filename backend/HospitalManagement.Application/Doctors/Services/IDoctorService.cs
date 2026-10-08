using HospitalManagement.Application.Doctors.DTOs;

namespace HospitalManagement.Application.Doctors.Services;

public interface IDoctorService
{
    Task<IEnumerable<DoctorDto>> GetDoctorsAsync(int? departmentId = null, CancellationToken cancellationToken = default);
    Task<DoctorDto?> GetDoctorByIdAsync(int doctorId, CancellationToken cancellationToken = default);
    Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<DoctorDto> CreateDoctorAsync(CreateDoctorRequest request, CancellationToken cancellationToken = default);
}
