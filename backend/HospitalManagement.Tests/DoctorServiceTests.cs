using FluentValidation;
using HospitalManagement.Application.Doctors.DTOs;
using HospitalManagement.Application.Doctors.Interfaces;
using HospitalManagement.Application.Doctors.Services;
using HospitalManagement.Application.Doctors.Validators;
using HospitalManagement.Domain.Entities;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class DoctorServiceTests
{
    private readonly Mock<IDoctorRepository> _repositoryMock;
    private readonly CreateDoctorValidator _validator;
    private readonly DoctorService _doctorService;

    public DoctorServiceTests()
    {
        _repositoryMock = new Mock<IDoctorRepository>();
        _validator = new CreateDoctorValidator();
        _doctorService = new DoctorService(_repositoryMock.Object, _validator);
    }

    [Fact]
    public async Task CreateDoctorAsync_WithValidRequest_ShouldCreateAndReturnDto()
    {
        // Arrange
        var request = new CreateDoctorRequest
        {
            DepartmentId = 1,
            LicenseNumber = "DOC-9999",
            FirstName = "Gregory",
            LastName = "House",
            Specialization = "Diagnostic Medicine",
            ConsultationFee = 250.00m,
            Phone = "+15551239876"
        };

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Doctor>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Doctor d, CancellationToken _) =>
            {
                d.DoctorId = 10;
                d.Department = new Department { DepartmentId = 1, Name = "Diagnostics" };
                return d;
            });

        _repositoryMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Doctor
            {
                DoctorId = 10,
                DepartmentId = 1,
                Department = new Department { DepartmentId = 1, Name = "Diagnostics" },
                LicenseNumber = "DOC-9999",
                FirstName = "Gregory",
                LastName = "House",
                Specialization = "Diagnostic Medicine",
                ConsultationFee = 250.00m,
                Phone = "+15551239876"
            });

        // Act
        var result = await _doctorService.CreateDoctorAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.DoctorId);
        Assert.Equal("Dr. Gregory House", result.FullName);
        Assert.Equal("Diagnostics", result.DepartmentName);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Doctor>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateDoctorAsync_WithInvalidRequest_ShouldThrowValidationException()
    {
        // Arrange
        var request = new CreateDoctorRequest
        {
            DepartmentId = 0, // Invalid
            LicenseNumber = "",
            FirstName = "",
            LastName = "",
            Specialization = "",
            ConsultationFee = -10.00m,
            Phone = ""
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _doctorService.CreateDoctorAsync(request));
    }
}
