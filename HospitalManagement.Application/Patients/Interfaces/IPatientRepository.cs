using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Patients.Interfaces;

public interface IPatientRepository
{
    Task<Patient?> GetByIdAsync(int patientId, CancellationToken cancellationToken = default);
    Task<Patient?> GetByMrnAsync(string mrn, CancellationToken cancellationToken = default);
    Task<(IEnumerable<Patient> Patients, int TotalCount)> GetPagedAsync(
        string? search, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    Task<Patient> AddAsync(Patient patient, CancellationToken cancellationToken = default);
    Task UpdateAsync(Patient patient, CancellationToken cancellationToken = default);
    Task<string> GenerateNextMrnAsync(CancellationToken cancellationToken = default);
}

