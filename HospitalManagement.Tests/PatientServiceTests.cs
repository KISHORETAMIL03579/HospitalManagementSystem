using FluentValidation;
using HospitalManagement.Application.Patients.DTOs;
using HospitalManagement.Application.Patients.Interfaces;
using HospitalManagement.Application.Patients.Services;
using HospitalManagement.Application.Patients.Validators;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class PatientServiceTests
{
    private readonly Mock<IPatientRepository> _repositoryMock;
    private readonly CreatePatientValidator _validator;
    private readonly PatientService _patientService;

    public PatientServiceTests()
    {
        _repositoryMock = new Mock<IPatientRepository>();
        _validator = new CreatePatientValidator();
        _patientService = new PatientService(_repositoryMock.Object, _validator);
    }

    [Fact]
    public async Task CreatePatientAsync_WithValidRequest_ShouldGenerateMrnAndReturnDto()
    {
        // Arrange
        var request = new CreatePatientRequest
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male,
            Phone = "+15550001111",
            Email = "john.doe@example.com"
        };

        _repositoryMock.Setup(r => r.GenerateNextMrnAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("MRN-2026-00001");

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Patient>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Patient p, CancellationToken _) =>
            {
                p.PatientId = 1;
                return p;
            });

        // Act
        var result = await _patientService.CreatePatientAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.PatientId);
        Assert.Equal("MRN-2026-00001", result.MedicalRecordNumber);
        Assert.Equal("John Doe", result.FullName);
        Assert.Equal(Gender.Male, result.Gender);

        _repositoryMock.Verify(r => r.GenerateNextMrnAsync(It.IsAny<CancellationToken>()), Times.Once);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Patient>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreatePatientAsync_WithEmptyFirstName_ShouldThrowValidationException()
    {
        // Arrange
        var request = new CreatePatientRequest
        {
            FirstName = "",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male,
            Phone = "+15550001111"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => _patientService.CreatePatientAsync(request));
    }
}

