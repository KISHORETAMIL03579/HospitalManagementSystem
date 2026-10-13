using FluentValidation;
using HospitalManagement.Application.Appointments.DTOs;
using HospitalManagement.Application.Appointments.Services;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly ILogger<AppointmentsController> _logger;

    public AppointmentsController(IAppointmentService appointmentService, ILogger<AppointmentsController> logger)
    {
        _appointmentService = appointmentService;
        _logger = logger;
    }

    /// <summary>
    /// Get list of appointments with optional filters (staff gets filtered records, patients get their own appointments based on userId)
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<AppointmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] int? patientId,
        [FromQuery] int? doctorId,
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken = default)
    {
        var isStaff = User.IsInRole("Admin") || User.IsInRole("HospitalManager") ||
                      User.IsInRole("Doctor") || User.IsInRole("Nurse") ||
                      User.IsInRole("Receptionist") || User.IsInRole("Pharmacist") ||
                      User.IsInRole("LabTechnician");

        if (isStaff)
        {
            var appointments = await _appointmentService.GetAppointmentsAsync(patientId, doctorId, date, cancellationToken);
            return Ok(appointments);
        }

        // For Patient role (or any patient user): automatically retrieve their own appointments based on userId!
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            var myAppointments = await _appointmentService.GetAppointmentsForUserAsync(userId, cancellationToken);
            return Ok(myAppointments);
        }

        return Forbid();
    }

    /// <summary>
    /// Get appointments scoped to the authenticated patient/user (record-level security)
    /// </summary>
    [HttpGet("my-appointments")]
    [ProducesResponseType(typeof(IEnumerable<AppointmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyAppointments(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Authentication token is missing user identifier claim." });
        }

        var appointments = await _appointmentService.GetAppointmentsForUserAsync(userId, cancellationToken);
        return Ok(appointments);
    }

    /// <summary>
    /// Get appointment details by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AppointmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAppointmentById(int id, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentService.GetAppointmentByIdAsync(id, cancellationToken);
        if (appointment is null)
        {
            return NotFound(new { message = $"Appointment with ID '{id}' was not found." });
        }

        return Ok(appointment);
    }

    /// <summary>
    /// Book a new appointment
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AppointmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAppointment(
        [FromBody] CreateAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (User.IsInRole("Patient") || request.PatientId <= 0)
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value;
                if (int.TryParse(userIdClaim, out var userId))
                {
                    var resolvedPatientId = await _appointmentService.GetPatientIdForUserAsync(userId, cancellationToken);
                    if (resolvedPatientId.HasValue && resolvedPatientId.Value > 0)
                    {
                        request.PatientId = resolvedPatientId.Value;
                    }
                }
            }

            var created = await _appointmentService.CreateAppointmentAsync(request, cancellationToken);
            _logger.LogInformation("Appointment booked successfully with ID {AppointmentId}", created.AppointmentId);
            return CreatedAtAction(nameof(GetAppointmentById), new { id = created.AppointmentId }, created);
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(new
            {
                status = 400,
                message = "Validation failed for appointment booking.",
                errors
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { status = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// Update appointment status (e.g., Confirmed, Completed, Cancelled, NoShow)
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin,HospitalManager,Doctor,Nurse,Receptionist,Patient")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAppointmentStatus(
        int id,
        [FromBody] UpdateAppointmentStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var existing = await _appointmentService.GetAppointmentByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return NotFound(new { message = $"Appointment with ID '{id}' was not found." });
        }

        await _appointmentService.UpdateStatusAsync(id, request.Status, request.Notes, cancellationToken);
        _logger.LogInformation("Appointment ID {AppointmentId} status updated to {Status}", id, request.Status);
        return NoContent();
    }
}
