using FluentValidation;
using HospitalManagement.Application.Doctors.DTOs;
using HospitalManagement.Application.Doctors.Services;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/doctors")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;
    private readonly HospitalManagement.Application.Doctors.Interfaces.IDoctorAvailabilityService _availabilityService;
    private readonly ILogger<DoctorsController> _logger;

    public DoctorsController(
        IDoctorService doctorService,
        HospitalManagement.Application.Doctors.Interfaces.IDoctorAvailabilityService availabilityService,
        ILogger<DoctorsController> logger)
    {
        _doctorService = doctorService;
        _availabilityService = availabilityService;
        _logger = logger;
    }

    /// <summary>
    /// Get all doctors with optional department filter
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DoctorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDoctors([FromQuery] int? departmentId, CancellationToken cancellationToken = default)
    {
        var doctors = await _doctorService.GetDoctorsAsync(departmentId, cancellationToken);
        return Ok(doctors);
    }

    /// <summary>
    /// Get doctor details by Doctor ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(DoctorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDoctorById(int id, CancellationToken cancellationToken = default)
    {
        var doctor = await _doctorService.GetDoctorByIdAsync(id, cancellationToken);
        if (doctor is null)
        {
            return NotFound(new { message = $"Doctor with ID '{id}' was not found." });
        }

        return Ok(doctor);
    }

    /// <summary>
    /// Get all active hospital departments
    /// </summary>
    [HttpGet("departments")]
    [ProducesResponseType(typeof(IEnumerable<DepartmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDepartments(CancellationToken cancellationToken = default)
    {
        var departments = await _doctorService.GetDepartmentsAsync(cancellationToken);
        return Ok(departments);
    }

    /// <summary>
    /// Register a new doctor
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,HospitalManager")]
    [ProducesResponseType(typeof(DoctorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDoctor(
        [FromBody] CreateDoctorRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _doctorService.CreateDoctorAsync(request, cancellationToken);
            _logger.LogInformation("Doctor registered successfully with ID {DoctorId}", created.DoctorId);
            return CreatedAtAction(nameof(GetDoctorById), new { id = created.DoctorId }, created);
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(new
            {
                status = 400,
                message = "Validation failed for doctor creation.",
                errors
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { status = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// Get doctor directory with live dynamic availability status
    /// </summary>
    [HttpGet("directory")]
    [ProducesResponseType(typeof(IEnumerable<DoctorDirectoryItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDoctorDirectory(
        [FromQuery] int? departmentId,
        [FromQuery] string? search,
        [FromQuery] DateOnly? date,
        CancellationToken cancellationToken = default)
    {
        var directory = await _availabilityService.GetDoctorDirectoryAsync(departmentId, search, date, cancellationToken);
        return Ok(directory);
    }

    /// <summary>
    /// Get detailed availability and time slots for a doctor on a specific date
    /// </summary>
    [HttpGet("{id:int}/availability")]
    [ProducesResponseType(typeof(DoctorAvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDoctorAvailability(
        int id,
        [FromQuery] DateOnly? date,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var targetDate = date ?? DateOnly.FromDateTime(DateTime.Today);
            var availability = await _availabilityService.GetDoctorAvailabilityAsync(id, targetDate, cancellationToken);
            return Ok(availability);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get weekly recurring schedules for a doctor
    /// </summary>
    [HttpGet("{id:int}/schedules")]
    [ProducesResponseType(typeof(IEnumerable<DoctorScheduleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDoctorSchedules(int id, CancellationToken cancellationToken = default)
    {
        var schedules = await _availabilityService.GetDoctorSchedulesAsync(id, cancellationToken);
        return Ok(schedules);
    }

    /// <summary>
    /// Save or replace recurring schedules for a doctor (supports multiple sessions per day)
    /// </summary>
    [HttpPut("{id:int}/schedules")]
    [Authorize(Roles = "Admin,HospitalManager,Doctor,Receptionist")]
    [ProducesResponseType(typeof(IEnumerable<DoctorScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveDoctorSchedules(
        int id,
        [FromBody] IEnumerable<SaveDoctorScheduleDto> schedules,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _availabilityService.SaveDoctorSchedulesAsync(id, schedules, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get date-specific schedule exceptions (leave, unavailable blocks, overtime)
    /// </summary>
    [HttpGet("{id:int}/schedule-exceptions")]
    [ProducesResponseType(typeof(IEnumerable<DoctorScheduleExceptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDoctorExceptions(
        int id,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken cancellationToken = default)
    {
        var exceptions = await _availabilityService.GetDoctorExceptionsAsync(id, fromDate, toDate, cancellationToken);
        return Ok(exceptions);
    }

    /// <summary>
    /// Check for conflicts between a proposed schedule exception and existing patient appointments
    /// </summary>
    [HttpPost("{id:int}/schedule-exceptions/check-conflicts")]
    [ProducesResponseType(typeof(ConflictCheckResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckConflicts(
        int id,
        [FromBody] CreateDoctorScheduleExceptionDto dto,
        CancellationToken cancellationToken = default)
    {
        var conflictResult = await _availabilityService.CheckExceptionConflictsAsync(id, dto, cancellationToken);
        return Ok(conflictResult);
    }

    /// <summary>
    /// Create a date-specific schedule exception
    /// </summary>
    [HttpPost("{id:int}/schedule-exceptions")]
    [Authorize(Roles = "Admin,HospitalManager,Doctor,Receptionist")]
    [ProducesResponseType(typeof(DoctorScheduleExceptionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateDoctorException(
        int id,
        [FromBody] CreateDoctorScheduleExceptionDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _availabilityService.CreateExceptionAsync(id, dto, cancellationToken);
            return CreatedAtAction(nameof(GetDoctorExceptions), new { id }, created);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a schedule exception
    /// </summary>
    [HttpDelete("{id:int}/schedule-exceptions/{exceptionId:int}")]
    [Authorize(Roles = "Admin,HospitalManager,Doctor,Receptionist")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteDoctorException(
        int id,
        int exceptionId,
        CancellationToken cancellationToken = default)
    {
        await _availabilityService.DeleteExceptionAsync(id, exceptionId, cancellationToken);
        return NoContent();
    }
}
