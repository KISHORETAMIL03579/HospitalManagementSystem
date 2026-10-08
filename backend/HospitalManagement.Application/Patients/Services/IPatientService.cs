using HospitalManagement.Application.Patients.DTOs;

namespace HospitalManagement.Application.Patients.Services;

public interface IPatientService
{
    Task<PatientDto?> GetByIdAsync(int patientId, CancellationToken cancellationToken = default);
    Task<PatientListResponse> GetPatientsAsync(string? search, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default);
    Task<PatientDto> CreatePatientAsync(CreatePatientRequest request, CancellationToken cancellationToken = default);
}

public class PatientListResponse
{
    public IEnumerable<PatientDto> Items { get; set; } = Enumerable.Empty<PatientDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

