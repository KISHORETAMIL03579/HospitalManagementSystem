using FluentValidation;
using HospitalManagement.Application.Appointments.DTOs;
using HospitalManagement.Application.Appointments.Services;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
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
    /// Get list of appointments with optional filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] int? patientId,
        [FromQuery] int? doctorId,
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken = default)
    {
        var appointments = await _appointmentService.GetAppointmentsAsync(patientId, doctorId, date, cancellationToken);
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
    [HttpPut("{id:int}/status")]
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
