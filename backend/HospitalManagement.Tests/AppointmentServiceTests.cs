using FluentValidation;
using HospitalManagement.Application.Appointments.DTOs;
using HospitalManagement.Application.Appointments.Interfaces;
using HospitalManagement.Application.Appointments.Services;
using HospitalManagement.Application.Appointments.Validators;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class AppointmentServiceTests
{
    private readonly Mock<IAppointmentRepository> _repositoryMock;
    private readonly CreateAppointmentValidator _validator;
    private readonly AppointmentService _appointmentService;

    public AppointmentServiceTests()
    {
        _repositoryMock = new Mock<IAppointmentRepository>();
        _validator = new CreateAppointmentValidator();
        _appointmentService = new AppointmentService(_repositoryMock.Object, _validator);
    }

    [Fact]
    public async Task CreateAppointmentAsync_WithAvailableSlot_ShouldBookAppointment()
    {
        // Arrange
        var request = new CreateAppointmentRequest
        {
            PatientId = 1,
            DoctorId = 2,
            AppointmentDate = DateTime.Today.AddDays(1),
            TimeSlot = "10:00:00",
            Reason = "Routine checkup"
        };

        _repositoryMock.Setup(r => r.IsSlotBookedAsync(2, DateTime.Today.AddDays(1).Date, TimeSpan.FromHours(10), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Appointment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Appointment a, CancellationToken _) =>
            {
                a.AppointmentId = 100;
                return a;
            });

        _repositoryMock.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Appointment
            {
                AppointmentId = 100,
                PatientId = 1,
                Patient = new Patient { PatientId = 1, FirstName = "Alice", LastName = "Smith", MedicalRecordNumber = "MRN-001" },
                DoctorId = 2,
                Doctor = new Doctor { DoctorId = 2, FirstName = "Eleanor", LastName = "Vance", Specialization = "Cardiologist" },
                AppointmentDate = DateTime.Today.AddDays(1).Date,
                TimeSlot = TimeSpan.FromHours(10),
                Status = AppointmentStatus.Confirmed,
                Reason = "Routine checkup"
            });

        // Act
        var result = await _appointmentService.CreateAppointmentAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result.AppointmentId);
        Assert.Equal("Alice Smith", result.PatientName);
        Assert.Equal("Dr. Eleanor Vance", result.DoctorName);
        Assert.Equal(AppointmentStatus.Confirmed, result.Status);
    }

    [Fact]
    public async Task CreateAppointmentAsync_WhenSlotAlreadyBooked_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var request = new CreateAppointmentRequest
        {
            PatientId = 1,
            DoctorId = 2,
            AppointmentDate = DateTime.Today.AddDays(1),
            TimeSlot = "10:00:00",
            Reason = "Followup"
        };

        _repositoryMock.Setup(r => r.IsSlotBookedAsync(2, DateTime.Today.AddDays(1).Date, TimeSpan.FromHours(10), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _appointmentService.CreateAppointmentAsync(request));
        Assert.Contains("already booked", ex.Message);
    }
}
