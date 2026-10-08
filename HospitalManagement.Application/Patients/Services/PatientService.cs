using FluentValidation;
using HospitalManagement.Application.Patients.DTOs;
using HospitalManagement.Application.Patients.Interfaces;
using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Patients.Services;

public class PatientService : IPatientService
{
    private readonly IPatientRepository _patientRepository;
    private readonly IValidator<CreatePatientRequest> _validator;

    public PatientService(IPatientRepository patientRepository, IValidator<CreatePatientRequest> validator)
    {
        _patientRepository = patientRepository;
        _validator = validator;
    }

    public async Task<PatientDto?> GetByIdAsync(int patientId, CancellationToken cancellationToken = default)
    {
        var patient = await _patientRepository.GetByIdAsync(patientId, cancellationToken);
        return patient is null ? null : MapToDto(patient);
    }

    public async Task<PatientListResponse> GetPatientsAsync(string? search, int page = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (patients, totalCount) = await _patientRepository.GetPagedAsync(search, page, pageSize, cancellationToken);

        return new PatientListResponse
        {
            Items = patients.Select(MapToDto),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PatientDto> CreatePatientAsync(CreatePatientRequest request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var mrn = await _patientRepository.GenerateNextMrnAsync(cancellationToken);

        var patient = new Patient
        {
            MedicalRecordNumber = mrn,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim(),
            Address = request.Address?.Trim(),
            EmergencyContactName = request.EmergencyContactName?.Trim(),
            EmergencyContactPhone = request.EmergencyContactPhone?.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var created = await _patientRepository.AddAsync(patient, cancellationToken);
        return MapToDto(created);
    }

    private static PatientDto MapToDto(Patient p) => new()
    {
        PatientId = p.PatientId,
        MedicalRecordNumber = p.MedicalRecordNumber,
        FirstName = p.FirstName,
        LastName = p.LastName,
        FullName = p.FullName,
        DateOfBirth = p.DateOfBirth,
        Gender = p.Gender,
        Phone = p.Phone,
        Email = p.Email,
        Address = p.Address,
        EmergencyContactName = p.EmergencyContactName,
        EmergencyContactPhone = p.EmergencyContactPhone,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt
    };
}

