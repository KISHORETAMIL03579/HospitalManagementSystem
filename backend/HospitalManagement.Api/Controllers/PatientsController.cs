using FluentValidation;
using HospitalManagement.Application.Patients.DTOs;
using HospitalManagement.Application.Patients.Services;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(IPatientService patientService, ILogger<PatientsController> logger)
    {
        _patientService = patientService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of patients with optional search query
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PatientListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPatients(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var response = await _patientService.GetPatientsAsync(search, page, pageSize, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get patient details by Patient ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PatientDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPatientById(int id, CancellationToken cancellationToken = default)
    {
        var patient = await _patientService.GetByIdAsync(id, cancellationToken);
        if (patient is null)
        {
            return NotFound(new { message = $"Patient with ID '{id}' was not found." });
        }

        return Ok(patient);
    }

    /// <summary>
    /// Register a new patient
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PatientDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePatient(
        [FromBody] CreatePatientRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var created = await _patientService.CreatePatientAsync(request, cancellationToken);
            _logger.LogInformation("Patient registered successfully with MRN {MRN}", created.MedicalRecordNumber);
            return CreatedAtAction(nameof(GetPatientById), new { id = created.PatientId }, created);
        }
        catch (ValidationException ex)
        {
            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(new
            {
                status = 400,
                message = "Validation failed for patient registration.",
                errors
            });
        }
    }
}

