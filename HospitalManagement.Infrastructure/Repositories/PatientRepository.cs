using HospitalManagement.Application.Patients.Interfaces;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HospitalManagement.Infrastructure.Repositories;

public class PatientRepository : IPatientRepository
{
    private readonly HospitalDbContext _context;

    public PatientRepository(HospitalDbContext context)
    {
        _context = context;
    }

    public async Task<Patient?> GetByIdAsync(int patientId, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PatientId == patientId && p.IsActive, cancellationToken);
    }

    public async Task<Patient?> GetByMrnAsync(string mrn, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.MedicalRecordNumber == mrn && p.IsActive, cancellationToken);
    }

    public async Task<(IEnumerable<Patient> Patients, int TotalCount)> GetPagedAsync(
        string? search, 
        int page, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Patients.AsNoTracking().Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchPattern = $"%{search.Trim()}%";
            query = query.Where(p => 
                EF.Functions.Like(p.FirstName, searchPattern) ||
                EF.Functions.Like(p.LastName, searchPattern) ||
                EF.Functions.Like(p.MedicalRecordNumber, searchPattern) ||
                EF.Functions.Like(p.Phone, searchPattern));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var patients = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (patients, totalCount);
    }

    public async Task<Patient> AddAsync(Patient patient, CancellationToken cancellationToken = default)
    {
        await _context.Patients.AddAsync(patient, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return patient;
    }

    public async Task UpdateAsync(Patient patient, CancellationToken cancellationToken = default)
    {
        _context.Patients.Update(patient);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<string> GenerateNextMrnAsync(CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"MRN-{year}-";
        
        var maxNumber = await _context.Patients
            .Where(p => p.MedicalRecordNumber.StartsWith(prefix))
            .Select(p => p.MedicalRecordNumber)
            .ToListAsync(cancellationToken);

        var nextSequence = maxNumber
            .Select(mrn => int.TryParse(mrn.Replace(prefix, ""), out var num) ? num : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{prefix}{nextSequence:D5}";
    }
}

