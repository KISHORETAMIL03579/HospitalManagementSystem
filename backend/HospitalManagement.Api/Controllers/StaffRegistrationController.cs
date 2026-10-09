using System.Security.Claims;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.StaffRegistration.Services;
using HospitalManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class StaffRegistrationController : ControllerBase
{
    private readonly IStaffRegistrationService _staffRegistrationService;
    private readonly ILogger<StaffRegistrationController> _logger;

    public StaffRegistrationController(IStaffRegistrationService staffRegistrationService, ILogger<StaffRegistrationController> logger)
    {
        _staffRegistrationService = staffRegistrationService;
        _logger = logger;
    }

    /// <summary>
    /// Submit staff onboarding registration request for administrative review
    /// </summary>
    [HttpPost("requests")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StaffRegistrationRequestDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitStaffRegistrationRequest([FromBody] SubmitStaffRegistrationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _staffRegistrationService.SubmitStaffRegistrationRequestAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetRegistrationStatus), new { email = created.Email }, created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Check registration status for a staff onboarding request
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StaffRegistrationRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRegistrationStatus([FromQuery] string email, CancellationToken cancellationToken)
    {
        var status = await _staffRegistrationService.GetStaffRegistrationStatusAsync(email, cancellationToken);
        if (status is null)
        {
            return NotFound(new { message = $"No registration record found for email '{email}'." });
        }
        return Ok(status);
    }

    /// <summary>
    /// List staff registration requests for administrative review
    /// </summary>
    [HttpGet("requests/admin")]
    [Authorize(Roles = "Admin,HospitalManager")]
    [ProducesResponseType(typeof(IEnumerable<StaffRegistrationRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaffRequests([FromQuery] RegistrationStatus? status, CancellationToken cancellationToken)
    {
        var requests = await _staffRegistrationService.GetStaffRegistrationRequestsAsync(status, cancellationToken);
        return Ok(requests);
    }

    /// <summary>
    /// Approve a staff registration request and provision user account
    /// </summary>
    [HttpPost("requests/{id:int}/approve")]
    [Authorize(Roles = "Admin,HospitalManager")]
    [ProducesResponseType(typeof(StaffRegistrationRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveStaffRequest(int id, [FromBody] ApproveStaffRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        try
        {
            var approved = await _staffRegistrationService.ApproveStaffRegistrationRequestAsync(id, adminUserId, request, cancellationToken);
            _logger.LogInformation("Admin #{AdminId} approved staff request #{RequestId}", adminUserId, id);
            return Ok(approved);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Reject a staff registration request
    /// </summary>
    [HttpPost("requests/{id:int}/reject")]
    [Authorize(Roles = "Admin,HospitalManager")]
    [ProducesResponseType(typeof(StaffRegistrationRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectStaffRequest(int id, [FromBody] RejectStaffRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        try
        {
            var rejected = await _staffRegistrationService.RejectStaffRegistrationRequestAsync(id, adminUserId, request, cancellationToken);
            _logger.LogInformation("Admin #{AdminId} rejected staff request #{RequestId}", adminUserId, id);
            return Ok(rejected);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retry sending notification email for a staff registration request
    /// </summary>
    [HttpPost("requests/{id:int}/retry-email")]
    [Authorize(Roles = "Admin,HospitalManager")]
    [ProducesResponseType(typeof(StaffRegistrationRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RetryStaffNotificationEmail(int id, CancellationToken cancellationToken)
    {
        try
        {
            var retried = await _staffRegistrationService.RetryStaffNotificationEmailAsync(id, cancellationToken);
            _logger.LogInformation("Admin requested email retry for staff request #{RequestId}", id);
            return Ok(retried);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
