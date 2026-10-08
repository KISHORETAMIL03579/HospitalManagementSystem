using FluentValidation;
using HospitalManagement.Application.Doctors.DTOs;
using HospitalManagement.Application.Doctors.Services;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;
    private readonly ILogger<DoctorsController> _logger;

    public DoctorsController(IDoctorService doctorService, ILogger<DoctorsController> logger)
    {
        _doctorService = doctorService;
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
}
