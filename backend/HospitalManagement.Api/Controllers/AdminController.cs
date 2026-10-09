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

    /// <summary>
    /// Retry sending notification email for a staff registration request
    /// </summary>
    [HttpPost("staff-requests/{id:int}/retry-email")]
    [ProducesResponseType(typeof(StaffRegistrationRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RetryStaffNotificationEmail(int id, CancellationToken cancellationToken)
    {
        try
        {
            var retried = await _authService.RetryStaffNotificationEmailAsync(id, cancellationToken);
            _logger.LogInformation("Admin requested email retry for staff request #{RequestId}", id);
            return Ok(retried);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieve all registered user accounts for direct administration
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? search, [FromQuery] int? roleId, [FromQuery] bool? isActive, CancellationToken cancellationToken)
    {
        var users = await _authService.GetAllUsersForAdminAsync(search, roleId, isActive, cancellationToken);
        return Ok(users);
    }

    /// <summary>
    /// Admin directly creates a new user account
    /// </summary>
    [HttpPost("users")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserByAdminRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _authService.CreateUserByAdminAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetAllUsers), new { id = user.UserId }, user);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Edit user account details
    /// </summary>
    [HttpPut("users/{id:int}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserByAdminRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _authService.UpdateUserByAdminAsync(id, request, cancellationToken);
            return Ok(updated);
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
    /// Change assigned user role directly
    /// </summary>
    [HttpPut("users/{id:int}/role")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _authService.UpdateUserRoleByAdminAsync(id, request.RoleId, cancellationToken);
            return Ok(updated);
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
    /// Toggle user account active status (Activate / Deactivate)
    /// </summary>
    [HttpPatch("users/{id:int}/status")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleUserStatus(int id, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        try
        {
            var updated = await _authService.ToggleUserStatusByAdminAsync(id, adminUserId, request.IsActive, cancellationToken);
            return Ok(updated);
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
    /// Soft delete / remove user account
    /// </summary>
    [HttpDelete("users/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        try
        {
            await _authService.DeleteUserByAdminAsync(id, adminUserId, cancellationToken);
            return Ok(new { message = "User account deactivated and archived successfully. Medical records preserved." });
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
}

