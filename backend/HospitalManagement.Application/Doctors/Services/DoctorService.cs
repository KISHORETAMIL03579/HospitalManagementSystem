using FluentValidation;
using HospitalManagement.Application.Doctors.DTOs;
using HospitalManagement.Application.Doctors.Interfaces;
using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Doctors.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IValidator<CreateDoctorRequest> _validator;

    public DoctorService(IDoctorRepository doctorRepository, IValidator<CreateDoctorRequest> validator)
    {
        _doctorRepository = doctorRepository;
        _validator = validator;
    }

    public async Task<IEnumerable<DoctorDto>> GetDoctorsAsync(int? departmentId = null, CancellationToken cancellationToken = default)
    {
        var doctors = await _doctorRepository.GetAllAsync(departmentId, cancellationToken);
        return doctors.Select(MapToDto);
    }

    public async Task<DoctorDto?> GetDoctorByIdAsync(int doctorId, CancellationToken cancellationToken = default)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, cancellationToken);
        return doctor is null ? null : MapToDto(doctor);
    }

    public async Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        var departments = await _doctorRepository.GetDepartmentsAsync(cancellationToken);
        return departments.Select(d => new DepartmentDto
        {
            DepartmentId = d.DepartmentId,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            DoctorCount = d.Doctors.Count
        });
    }

    public async Task<DoctorDto> CreateDoctorAsync(CreateDoctorRequest request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var doctor = new Doctor
        {
            DepartmentId = request.DepartmentId,
            LicenseNumber = request.LicenseNumber.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Specialization = request.Specialization.Trim(),
            ConsultationFee = request.ConsultationFee,
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim(),
            AvailableDays = request.AvailableDays,
            StartTime = TimeSpan.Parse(request.StartTime),
            EndTime = TimeSpan.Parse(request.EndTime),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var created = await _doctorRepository.AddAsync(doctor, cancellationToken);
        return MapToDto(created);
    }

    private static DoctorDto MapToDto(Doctor d) => new()
    {
        DoctorId = d.DoctorId,
        DepartmentId = d.DepartmentId,
        DepartmentName = d.Department?.Name ?? "General",
        LicenseNumber = d.LicenseNumber,
        FirstName = d.FirstName,
        LastName = d.LastName,
        FullName = d.FullName,
        Specialization = d.Specialization,
        ConsultationFee = d.ConsultationFee,
        Phone = d.Phone,
        Email = d.Email,
        AvailableDays = d.AvailableDays ?? "Monday-Friday",
        StartTime = d.StartTime.ToString(@"hh\:mm"),
        EndTime = d.EndTime.ToString(@"hh\:mm")
    };
}
