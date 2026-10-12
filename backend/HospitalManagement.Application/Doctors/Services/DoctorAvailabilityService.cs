using HospitalManagement.Application.Appointments.Interfaces;
using HospitalManagement.Application.Doctors.DTOs;
using HospitalManagement.Application.Doctors.Interfaces;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Doctors.Services;

public class DoctorAvailabilityService : IDoctorAvailabilityService
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly TimeProvider _timeProvider;

    public DoctorAvailabilityService(
        IDoctorRepository doctorRepository,
        IAppointmentRepository appointmentRepository,
        TimeProvider? timeProvider = null)
    {
        _doctorRepository = doctorRepository;
        _appointmentRepository = appointmentRepository;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<DoctorAvailabilityDto> GetDoctorAvailabilityAsync(int doctorId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, cancellationToken)
            ?? throw new KeyNotFoundException($"Doctor with ID {doctorId} was not found.");

        var schedules = (await _doctorRepository.GetSchedulesAsync(doctorId, cancellationToken)).ToList();
        var exceptions = (await _doctorRepository.GetExceptionsAsync(doctorId, date, date, cancellationToken)).ToList();

        var targetDateTime = date.ToDateTime(TimeOnly.MinValue);
        var appointments = (await _appointmentRepository.GetFilteredAsync(doctorId: doctorId, date: targetDateTime, cancellationToken: cancellationToken))
            .Where(a => a.IsActive && a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.NoShow)
            .ToList();

        var localNow = _timeProvider.GetLocalNow();
        var today = DateOnly.FromDateTime(localNow.DateTime);
        var currentTime = TimeOnly.FromDateTime(localNow.DateTime);

        var result = new DoctorAvailabilityDto
        {
            DoctorId = doctor.DoctorId,
            DoctorName = $"Dr. {doctor.FirstName} {doctor.LastName}".Trim(),
            Specialization = doctor.Specialization,
            DepartmentName = doctor.Department?.Name ?? "General Medicine",
            ConsultationFee = doctor.ConsultationFee,
            Date = date,
            TimeZone = TimeZoneInfo.Local.Id
        };

        if (!doctor.IsActive)
        {
            result.AvailabilityStatus = "Inactive";
            result.StatusMessage = "Doctor account is currently inactive.";
            return result;
        }

        // Layer 1: Base recurring schedule for the day
        var dayOfWeek = date.DayOfWeek;
        var daySchedules = schedules.Where(s => s.DayOfWeek == dayOfWeek && s.IsActive).OrderBy(s => s.StartTime).ToList();

        var slots = new List<TimeSlotDto>();

        foreach (var schedule in daySchedules)
        {
            var duration = schedule.SlotDurationMinutes > 0 ? schedule.SlotDurationMinutes : 30;
            var current = schedule.StartTime;

            while (current.AddMinutes(duration) <= schedule.EndTime)
            {
                var slotEnd = current.AddMinutes(duration);
                slots.Add(new TimeSlotDto
                {
                    StartTime = current,
                    EndTime = slotEnd,
                    FormattedTime = $"{FormatTime(current)} - {FormatTime(slotEnd)}",
                    IsBookable = true,
                    Status = "Available",
                    SessionName = schedule.SessionName ?? "Regular Session"
                });

                current = slotEnd;
            }
        }

        // Layer 2: Extra working hours exceptions
        var extraHours = exceptions.Where(e => e.ExceptionType == ScheduleExceptionType.ExtraWorkingHours && e.StartTime.HasValue && e.EndTime.HasValue).ToList();
        foreach (var extra in extraHours)
        {
            var start = extra.StartTime!.Value;
            var end = extra.EndTime!.Value;
            var duration = 30;
            var current = start;

            while (current.AddMinutes(duration) <= end)
            {
                var slotEnd = current.AddMinutes(duration);
                if (!slots.Any(s => s.StartTime == current))
                {
                    slots.Add(new TimeSlotDto
                    {
                        StartTime = current,
                        EndTime = slotEnd,
                        FormattedTime = $"{FormatTime(current)} - {FormatTime(slotEnd)}",
                        IsBookable = true,
                        Status = "Available",
                        SessionName = string.IsNullOrWhiteSpace(extra.Reason) ? "Extra Working Hours" : $"Extra Hours ({extra.Reason})"
                    });
                }
                current = slotEnd;
            }
        }

        // Check for full day leave exception
        var fullDayLeave = exceptions.FirstOrDefault(e => e.ExceptionType == ScheduleExceptionType.FullDayLeave);
        if (fullDayLeave != null)
        {
            foreach (var slot in slots)
            {
                slot.IsBookable = false;
                slot.Status = "Blocked";
                slot.BlockReason = string.IsNullOrWhiteSpace(fullDayLeave.Reason) ? "On Leave" : fullDayLeave.Reason;
            }

            result.Slots = slots.OrderBy(s => s.StartTime).ToList();
            result.TotalSlotsCount = slots.Count;
            result.BookableSlotsCount = 0;
            result.BlockedSlotsCount = slots.Count;
            result.AvailabilityStatus = "On leave";
            result.StatusMessage = string.IsNullOrWhiteSpace(fullDayLeave.Reason) ? "On leave" : $"On leave: {fullDayLeave.Reason}";
            return result;
        }

        // Layer 3: Partial unavailable block exceptions
        var unavailableBlocks = exceptions.Where(e => e.ExceptionType == ScheduleExceptionType.Unavailable && e.StartTime.HasValue && e.EndTime.HasValue).ToList();
        foreach (var block in unavailableBlocks)
        {
            var blockStart = block.StartTime!.Value;
            var blockEnd = block.EndTime!.Value;

            foreach (var slot in slots)
            {
                if (slot.StartTime < blockEnd && blockStart < slot.EndTime)
                {
                    slot.IsBookable = false;
                    slot.Status = "Blocked";
                    slot.BlockReason = string.IsNullOrWhiteSpace(block.Reason) ? "Unavailable" : block.Reason;
                }
            }
        }

        // Layer 4: Active appointments
        foreach (var appt in appointments)
        {
            var apptStart = TimeOnly.FromTimeSpan(appt.TimeSlot);
            var apptEnd = apptStart.AddMinutes(30);

            foreach (var slot in slots)
            {
                if (slot.StartTime < apptEnd && apptStart < slot.EndTime)
                {
                    slot.IsBookable = false;
                    slot.Status = "Booked";
                }
            }
        }

        // Layer 5: Past slots for today
        if (date == today)
        {
            foreach (var slot in slots)
            {
                if (slot.StartTime <= currentTime && slot.IsBookable)
                {
                    slot.IsBookable = false;
                    slot.Status = "Past";
                }
            }
        }
        else if (date < today)
        {
            foreach (var slot in slots)
            {
                slot.IsBookable = false;
                slot.Status = "Past";
            }
        }

        slots = slots.OrderBy(s => s.StartTime).ToList();
        result.Slots = slots;
        result.TotalSlotsCount = slots.Count;
        result.BookableSlotsCount = slots.Count(s => s.IsBookable);
        result.BookedSlotsCount = slots.Count(s => s.Status == "Booked");
        result.BlockedSlotsCount = slots.Count(s => s.Status == "Blocked");

        var firstBookable = slots.FirstOrDefault(s => s.IsBookable);
        result.NextAvailableSlot = firstBookable?.StartTime;

        // Dynamic availability status determination
        if (slots.Count == 0)
        {
            result.AvailabilityStatus = "Unavailable";
            result.StatusMessage = "No scheduled consultation hours for this day.";
        }
        else if (result.BookableSlotsCount == 0)
        {
            result.AvailabilityStatus = "Fully booked";
            result.StatusMessage = "All consultation slots for this date are fully booked or unavailable.";
        }
        else if (date == today)
        {
            var isCurrentSlotAvailable = slots.Any(s => s.IsBookable && s.StartTime <= currentTime && currentTime < s.EndTime);
            if (isCurrentSlotAvailable)
            {
                result.AvailabilityStatus = "Available now";
                result.StatusMessage = $"Available now (Next slot: {FormatTime(firstBookable!.StartTime)})";
            }
            else
            {
                result.AvailabilityStatus = "Available today";
                result.StatusMessage = $"Next slot: {FormatTime(firstBookable!.StartTime)}";
            }
        }
        else
        {
            result.AvailabilityStatus = "Available later";
            result.StatusMessage = $"Next slot: {FormatTime(firstBookable!.StartTime)}";
        }

        return result;
    }

    public async Task<IEnumerable<DoctorDirectoryItemDto>> GetDoctorDirectoryAsync(int? departmentId = null, string? search = null, DateOnly? targetDate = null, CancellationToken cancellationToken = default)
    {
        var doctors = (await _doctorRepository.GetAllAsync(departmentId, cancellationToken)).ToList();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            doctors = doctors.Where(d =>
                $"{d.FirstName} {d.LastName}".ToLowerInvariant().Contains(q) ||
                d.Specialization.ToLowerInvariant().Contains(q) ||
                (d.Department?.Name?.ToLowerInvariant().Contains(q) ?? false)).ToList();
        }

        var localNow = _timeProvider.GetLocalNow();
        var today = targetDate ?? DateOnly.FromDateTime(localNow.DateTime);

        var list = new List<DoctorDirectoryItemDto>();

        foreach (var doctor in doctors)
        {
            var todayAvail = await GetDoctorAvailabilityAsync(doctor.DoctorId, today, cancellationToken);

            var item = new DoctorDirectoryItemDto
            {
                DoctorId = doctor.DoctorId,
                FullName = $"Dr. {doctor.FirstName} {doctor.LastName}".Trim(),
                Specialization = doctor.Specialization,
                DepartmentId = doctor.DepartmentId,
                DepartmentName = doctor.Department?.Name ?? "General Medicine",
                LicenseNumber = doctor.LicenseNumber,
                ConsultationFee = doctor.ConsultationFee,
                Phone = doctor.Phone,
                Email = doctor.Email,
                YearsOfExperience = 8,
                Rating = 4.9,
                ReviewCount = 38,
                Languages = "English, Spanish",
                Biography = $"{doctor.Specialization} specialist with expertise in compassionate clinical care.",
                IsActive = doctor.IsActive,
                AvailabilityStatus = todayAvail.AvailabilityStatus,
                StatusBadge = todayAvail.AvailabilityStatus
            };

            if (todayAvail.BookableSlotsCount > 0 && todayAvail.NextAvailableSlot.HasValue)
            {
                item.NextAvailableDate = today;
                item.NextAvailableTime = todayAvail.NextAvailableSlot.Value;
                item.NextAvailableSlotText = todayAvail.AvailabilityStatus == "Available now"
                    ? $"Available now · Slot: {FormatTime(todayAvail.NextAvailableSlot.Value)}"
                    : $"Next slot: {FormatTime(todayAvail.NextAvailableSlot.Value)}";
            }
            else
            {
                // Inspect upcoming 7 days to find the next available slot
                DateOnly? foundDate = null;
                TimeOnly? foundTime = null;

                for (int i = 1; i <= 7; i++)
                {
                    var checkDate = today.AddDays(i);
                    var futureAvail = await GetDoctorAvailabilityAsync(doctor.DoctorId, checkDate, cancellationToken);
                    if (futureAvail.BookableSlotsCount > 0 && futureAvail.NextAvailableSlot.HasValue)
                    {
                        foundDate = checkDate;
                        foundTime = futureAvail.NextAvailableSlot.Value;
                        break;
                    }
                }

                if (foundDate.HasValue && foundTime.HasValue)
                {
                    item.NextAvailableDate = foundDate.Value;
                    item.NextAvailableTime = foundTime.Value;
                    if (foundDate.Value == today.AddDays(1))
                    {
                        item.NextAvailableSlotText = $"Available tomorrow at {FormatTime(foundTime.Value)}";
                    }
                    else
                    {
                        item.NextAvailableSlotText = $"Available {foundDate.Value:ddd, MMM d} at {FormatTime(foundTime.Value)}";
                    }
                }
                else
                {
                    item.NextAvailableSlotText = todayAvail.AvailabilityStatus == "On leave"
                        ? todayAvail.StatusMessage
                        : "No upcoming slots this week";
                }
            }

            list.Add(item);
        }

        return list;
    }

    public async Task<IEnumerable<DoctorScheduleDto>> GetDoctorSchedulesAsync(int doctorId, CancellationToken cancellationToken = default)
    {
        var schedules = await _doctorRepository.GetSchedulesAsync(doctorId, cancellationToken);
        return schedules.Select(s => new DoctorScheduleDto
        {
            ScheduleId = s.ScheduleId,
            DoctorId = s.DoctorId,
            DayOfWeek = s.DayOfWeek,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            SlotDurationMinutes = s.SlotDurationMinutes,
            SessionName = s.SessionName,
            IsActive = s.IsActive
        });
    }

    public async Task<IEnumerable<DoctorScheduleDto>> SaveDoctorSchedulesAsync(int doctorId, IEnumerable<SaveDoctorScheduleDto> schedules, CancellationToken cancellationToken = default)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, cancellationToken)
            ?? throw new KeyNotFoundException($"Doctor with ID {doctorId} was not found.");

        var entities = schedules.Select(s => new DoctorSchedule
        {
            DoctorId = doctorId,
            DayOfWeek = s.DayOfWeek,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            SlotDurationMinutes = s.SlotDurationMinutes > 0 ? s.SlotDurationMinutes : 30,
            SessionName = s.SessionName ?? "Clinic Session",
            IsActive = true
        }).ToList();

        await _doctorRepository.SaveSchedulesAsync(doctorId, entities, cancellationToken);

        return await GetDoctorSchedulesAsync(doctorId, cancellationToken);
    }

    public async Task<IEnumerable<DoctorScheduleExceptionDto>> GetDoctorExceptionsAsync(int doctorId, DateOnly? fromDate = null, DateOnly? toDate = null, CancellationToken cancellationToken = default)
    {
        var exceptions = await _doctorRepository.GetExceptionsAsync(doctorId, fromDate, toDate, cancellationToken);
        return exceptions.Select(e => new DoctorScheduleExceptionDto
        {
            ExceptionId = e.ExceptionId,
            DoctorId = e.DoctorId,
            Date = e.Date,
            StartTime = e.StartTime,
            EndTime = e.EndTime,
            ExceptionType = e.ExceptionType,
            Reason = e.Reason,
            CreatedAt = e.CreatedAt
        });
    }

    public async Task<ConflictCheckResultDto> CheckExceptionConflictsAsync(int doctorId, CreateDoctorScheduleExceptionDto dto, CancellationToken cancellationToken = default)
    {
        var targetDateTime = dto.Date.ToDateTime(TimeOnly.MinValue);
        var appointments = (await _appointmentRepository.GetFilteredAsync(doctorId: doctorId, date: targetDateTime, cancellationToken: cancellationToken))
            .Where(a => a.IsActive && a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.NoShow)
            .ToList();

        var conflictingAppointments = new List<ConflictingAppointmentDto>();

        foreach (var appt in appointments)
        {
            var isConflict = false;

            if (dto.ExceptionType == ScheduleExceptionType.FullDayLeave)
            {
                isConflict = true;
            }
            else if (dto.ExceptionType == ScheduleExceptionType.Unavailable && dto.StartTime.HasValue && dto.EndTime.HasValue)
            {
                var apptStart = TimeOnly.FromTimeSpan(appt.TimeSlot);
                var apptEnd = apptStart.AddMinutes(30);

                if (apptStart < dto.EndTime.Value && dto.StartTime.Value < apptEnd)
                {
                    isConflict = true;
                }
            }

            if (isConflict)
            {
                conflictingAppointments.Add(new ConflictingAppointmentDto
                {
                    AppointmentId = appt.AppointmentId,
                    PatientName = appt.Patient != null ? $"{appt.Patient.FirstName} {appt.Patient.LastName}".Trim() : "Patient",
                    MedicalRecordNumber = appt.Patient?.MedicalRecordNumber ?? "",
                    AppointmentDate = appt.AppointmentDate,
                    TimeSlot = appt.TimeSlot,
                    Status = appt.Status.ToString(),
                    Reason = appt.Reason ?? "Consultation"
                });
            }
        }

        return new ConflictCheckResultDto
        {
            HasConflicts = conflictingAppointments.Count > 0,
            ConflictCount = conflictingAppointments.Count,
            ConflictingAppointments = conflictingAppointments,
            Message = conflictingAppointments.Count > 0
                ? $"{conflictingAppointments.Count} existing appointment(s) conflict with this schedule exception."
                : "No conflicting appointments found."
        };
    }

    public async Task<DoctorScheduleExceptionDto> CreateExceptionAsync(int doctorId, CreateDoctorScheduleExceptionDto dto, CancellationToken cancellationToken = default)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId, cancellationToken)
            ?? throw new KeyNotFoundException($"Doctor with ID {doctorId} was not found.");

        var entity = new DoctorScheduleException
        {
            DoctorId = doctorId,
            Date = dto.Date,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            ExceptionType = dto.ExceptionType,
            Reason = dto.Reason,
            IsActive = true
        };

        var created = await _doctorRepository.AddExceptionAsync(entity, cancellationToken);

        return new DoctorScheduleExceptionDto
        {
            ExceptionId = created.ExceptionId,
            DoctorId = created.DoctorId,
            Date = created.Date,
            StartTime = created.StartTime,
            EndTime = created.EndTime,
            ExceptionType = created.ExceptionType,
            Reason = created.Reason,
            CreatedAt = created.CreatedAt
        };
    }

    public async Task DeleteExceptionAsync(int doctorId, int exceptionId, CancellationToken cancellationToken = default)
    {
        var exception = await _doctorRepository.GetExceptionByIdAsync(exceptionId, cancellationToken);
        if (exception != null && exception.DoctorId == doctorId)
        {
            await _doctorRepository.DeleteExceptionAsync(exceptionId, cancellationToken);
        }
    }

    private static string FormatTime(TimeOnly time)
    {
        return time.ToString("hh:mm tt");
    }
}
