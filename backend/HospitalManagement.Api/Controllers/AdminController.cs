using System.Security.Claims;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Services;
using HospitalManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,HospitalManager")]
[Route("api/v1/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAuthService authService, ILogger<AdminController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// List staff registration requests for administrative review
    /// </summary>
    [HttpGet("staff-requests")]
    [ProducesResponseType(typeof(IEnumerable<StaffRegistrationRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaffRequests([FromQuery] RegistrationStatus? status, CancellationToken cancellationToken)
    {
        var requests = await _authService.GetStaffRegistrationRequestsAsync(status, cancellationToken);
        return Ok(requests);
    }

    /// <summary>
    /// Approve a staff registration request and provision user account
    /// </summary>
    [HttpPost("staff-requests/{id:int}/approve")]
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
            var approved = await _authService.ApproveStaffRegistrationRequestAsync(id, adminUserId, request, cancellationToken);
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
    [HttpPost("staff-requests/{id:int}/reject")]
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
            var rejected = await _authService.RejectStaffRegistrationRequestAsync(id, adminUserId, request, cancellationToken);
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
}

