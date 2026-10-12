using HospitalManagement.Application.Appointments.Interfaces;
using HospitalManagement.Application.Doctors.DTOs;
using HospitalManagement.Application.Doctors.Interfaces;
using HospitalManagement.Application.Doctors.Services;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class DoctorAvailabilityServiceTests
{
    private readonly Mock<IDoctorRepository> _doctorRepoMock;
    private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
    private readonly DoctorAvailabilityService _service;
    private readonly Doctor _testDoctor;

    public DoctorAvailabilityServiceTests()
    {
        _doctorRepoMock = new Mock<IDoctorRepository>();
        _appointmentRepoMock = new Mock<IAppointmentRepository>();
        _service = new DoctorAvailabilityService(_doctorRepoMock.Object, _appointmentRepoMock.Object);

        _testDoctor = new Doctor
        {
            DoctorId = 1,
            FirstName = "Sarah",
            LastName = "Jenkins",
            Specialization = "Cardiology",
            ConsultationFee = 150.00m,
            IsActive = true,
            Department = new Department { DepartmentId = 1, Name = "Cardiology" }
        };

        _doctorRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testDoctor);
    }

    [Fact]
    public async Task GetDoctorAvailabilityAsync_WithMultipleSessions_GeneratesAllSlots()
    {
        // Arrange: Monday with morning (09:00 - 11:00) and afternoon (14:00 - 16:00) sessions
        var date = new DateOnly(2026, 10, 19); // Monday
        var schedules = new List<DoctorSchedule>
        {
            new()
            {
                ScheduleId = 1,
                DoctorId = 1,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(11, 0),
                SlotDurationMinutes = 30,
                SessionName = "Morning Clinic",
                IsActive = true
            },
            new()
            {
                ScheduleId = 2,
                DoctorId = 1,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeOnly(14, 0),
                EndTime = new TimeOnly(16, 0),
                SlotDurationMinutes = 30,
                SessionName = "Afternoon Clinic",
                IsActive = true
            }
        };

        _doctorRepoMock.Setup(r => r.GetSchedulesAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(schedules);
        _doctorRepoMock.Setup(r => r.GetExceptionsAsync(1, date, date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DoctorScheduleException>());
        _appointmentRepoMock.Setup(r => r.GetFilteredAsync(null, 1, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Appointment>());

        // Act
        var result = await _service.GetDoctorAvailabilityAsync(1, date);

        // Assert
        Assert.Equal(8, result.TotalSlotsCount); // 4 morning + 4 afternoon
        Assert.Equal(8, result.BookableSlotsCount);
        Assert.Equal("Available later", result.AvailabilityStatus);
        Assert.Contains(result.Slots, s => s.StartTime == new TimeOnly(9, 0) && s.SessionName == "Morning Clinic");
        Assert.Contains(result.Slots, s => s.StartTime == new TimeOnly(14, 0) && s.SessionName == "Afternoon Clinic");
    }

    [Fact]
    public async Task GetDoctorAvailabilityAsync_WithFullDayLeave_MarksAllSlotsBlockedAndStatusOnLeave()
    {
        // Arrange
        var date = new DateOnly(2026, 10, 19); // Monday
        var schedules = new List<DoctorSchedule>
        {
            new()
            {
                DoctorId = 1,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(12, 0),
                SlotDurationMinutes = 30,
                IsActive = true
            }
        };

        var exceptions = new List<DoctorScheduleException>
        {
            new()
            {
                DoctorId = 1,
                Date = date,
                ExceptionType = ScheduleExceptionType.FullDayLeave,
                Reason = "Medical Conference",
                IsActive = true
            }
        };

        _doctorRepoMock.Setup(r => r.GetSchedulesAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(schedules);
        _doctorRepoMock.Setup(r => r.GetExceptionsAsync(1, date, date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(exceptions);
        _appointmentRepoMock.Setup(r => r.GetFilteredAsync(null, 1, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Appointment>());

        // Act
        var result = await _service.GetDoctorAvailabilityAsync(1, date);

        // Assert
        Assert.Equal("On leave", result.AvailabilityStatus);
        Assert.Contains("Medical Conference", result.StatusMessage);
        Assert.Equal(0, result.BookableSlotsCount);
        Assert.All(result.Slots, s => Assert.False(s.IsBookable));
    }

    [Fact]
    public async Task GetDoctorAvailabilityAsync_WithPartialUnavailableBlock_BlocksOnlyOverlappingSlots()
    {
        // Arrange: 09:00 - 12:00 with block 10:00 - 11:00
        var date = new DateOnly(2026, 10, 19);
        var schedules = new List<DoctorSchedule>
        {
            new()
            {
                DoctorId = 1,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(12, 0),
                SlotDurationMinutes = 30,
                IsActive = true
            }
        };

        var exceptions = new List<DoctorScheduleException>
        {
            new()
            {
                DoctorId = 1,
                Date = date,
                ExceptionType = ScheduleExceptionType.Unavailable,
                StartTime = new TimeOnly(10, 0),
                EndTime = new TimeOnly(11, 0),
                Reason = "Department Meeting",
                IsActive = true
            }
        };

        _doctorRepoMock.Setup(r => r.GetSchedulesAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(schedules);
        _doctorRepoMock.Setup(r => r.GetExceptionsAsync(1, date, date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(exceptions);
        _appointmentRepoMock.Setup(r => r.GetFilteredAsync(null, 1, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Appointment>());

        // Act
        var result = await _service.GetDoctorAvailabilityAsync(1, date);

        // Assert
        // Total 6 slots: 09:00-09:30, 09:30-10:00, 10:00-10:30, 10:30-11:00, 11:00-11:30, 11:30-12:00
        // Overlapping with 10:00 - 11:00 are 10:00-10:30 and 10:30-11:00 (2 slots)
        Assert.Equal(6, result.TotalSlotsCount);
        Assert.Equal(4, result.BookableSlotsCount);
        Assert.Equal(2, result.BlockedSlotsCount);

        var blockedSlot = result.Slots.First(s => s.StartTime == new TimeOnly(10, 0));
        Assert.False(blockedSlot.IsBookable);
        Assert.Equal("Blocked", blockedSlot.Status);
        Assert.Equal("Department Meeting", blockedSlot.BlockReason);

        var availableSlot = result.Slots.First(s => s.StartTime == new TimeOnly(9, 0));
        Assert.True(availableSlot.IsBookable);
        Assert.Equal("Available", availableSlot.Status);
    }

    [Fact]
    public async Task GetDoctorAvailabilityAsync_WithActiveAppointment_MarksSlotBooked()
    {
        // Arrange: 09:00 - 11:00 schedule with an appointment at 09:30
        var date = new DateOnly(2026, 10, 19);
        var schedules = new List<DoctorSchedule>
        {
            new()
            {
                DoctorId = 1,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(11, 0),
                SlotDurationMinutes = 30,
                IsActive = true
            }
        };

        var appointments = new List<Appointment>
        {
            new()
            {
                AppointmentId = 55,
                DoctorId = 1,
                AppointmentDate = date.ToDateTime(TimeOnly.MinValue),
                TimeSlot = new TimeSpan(9, 30, 0),
                Status = AppointmentStatus.Confirmed,
                IsActive = true
            },
            new()
            {
                AppointmentId = 56,
                DoctorId = 1,
                AppointmentDate = date.ToDateTime(TimeOnly.MinValue),
                TimeSlot = new TimeSpan(10, 0, 0),
                Status = AppointmentStatus.Cancelled, // Cancelled must NOT occupy slot
                IsActive = true
            }
        };

        _doctorRepoMock.Setup(r => r.GetSchedulesAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(schedules);
        _doctorRepoMock.Setup(r => r.GetExceptionsAsync(1, date, date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DoctorScheduleException>());
        _appointmentRepoMock.Setup(r => r.GetFilteredAsync(null, 1, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(appointments);

        // Act
        var result = await _service.GetDoctorAvailabilityAsync(1, date);

        // Assert
        Assert.Equal(4, result.TotalSlotsCount);
        Assert.Equal(3, result.BookableSlotsCount);
        Assert.Equal(1, result.BookedSlotsCount);

        var slot930 = result.Slots.First(s => s.StartTime == new TimeOnly(9, 30));
        Assert.False(slot930.IsBookable);
        Assert.Equal("Booked", slot930.Status);

        var slot1000 = result.Slots.First(s => s.StartTime == new TimeOnly(10, 0));
        Assert.True(slot1000.IsBookable);
        Assert.Equal("Available", slot1000.Status);
    }

    [Fact]
    public async Task CheckExceptionConflictsAsync_DetectsCollisionsWithPendingOrConfirmedAppointments()
    {
        // Arrange
        var date = new DateOnly(2026, 10, 20);
        var appointments = new List<Appointment>
        {
            new()
            {
                AppointmentId = 101,
                DoctorId = 1,
                AppointmentDate = date.ToDateTime(TimeOnly.MinValue),
                TimeSlot = new TimeSpan(14, 0, 0),
                Status = AppointmentStatus.Confirmed,
                IsActive = true,
                Patient = new Patient { FirstName = "John", LastName = "Doe", MedicalRecordNumber = "MRN-100" }
            }
        };

        _appointmentRepoMock.Setup(r => r.GetFilteredAsync(null, 1, It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(appointments);

        var dto = new CreateDoctorScheduleExceptionDto
        {
            Date = date,
            ExceptionType = ScheduleExceptionType.Unavailable,
            StartTime = new TimeOnly(13, 30),
            EndTime = new TimeOnly(15, 0),
            Reason = "Emergency Procedure"
        };

        // Act
        var result = await _service.CheckExceptionConflictsAsync(1, dto);

        // Assert
        Assert.True(result.HasConflicts);
        Assert.Equal(1, result.ConflictCount);
        Assert.Single(result.ConflictingAppointments);
        Assert.Equal(101, result.ConflictingAppointments[0].AppointmentId);
        Assert.Equal("John Doe", result.ConflictingAppointments[0].PatientName);
    }
}
