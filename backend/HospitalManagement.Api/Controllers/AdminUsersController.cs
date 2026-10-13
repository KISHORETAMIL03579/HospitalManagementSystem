using System.Security.Claims;
using HospitalManagement.Application.Admin.Services;
using HospitalManagement.Application.Auth.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,HospitalManager")]
[Tags("Admin - Users")]
[Route("api/v1/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(IAdminUserService adminUserService, ILogger<AdminUsersController> logger)
    {
        _adminUserService = adminUserService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieve all registered user accounts for direct administration
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? search, [FromQuery] int? roleId, [FromQuery] bool? isActive, CancellationToken cancellationToken)
    {
        var users = await _adminUserService.GetAllUsersForAdminAsync(search, roleId, isActive, cancellationToken);
        return Ok(users);
    }

    /// <summary>
    /// Admin directly creates a new user account
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserByAdminRequest request, CancellationToken cancellationToken)
    {
        if (!User.IsInRole("Admin") && request.RoleId == 1)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Hospital Managers cannot create Administrator accounts." });
        }

        try
        {
            var user = await _adminUserService.CreateUserByAdminAsync(request, cancellationToken);
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
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserByAdminRequest request, CancellationToken cancellationToken)
    {
        if (!User.IsInRole("Admin"))
        {
            if (request.RoleId == 1 || await IsTargetAdminAsync(id, cancellationToken))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Hospital Managers cannot modify Administrator accounts or elevate users to Administrator." });
            }
        }

        try
        {
            var updated = await _adminUserService.UpdateUserByAdminAsync(id, request, cancellationToken);
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
    [HttpPut("{id:int}/role")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
        if (!User.IsInRole("Admin"))
        {
            if (request.RoleId == 1 || await IsTargetAdminAsync(id, cancellationToken))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Hospital Managers cannot assign the Administrator role or modify Administrator accounts." });
            }
        }

        try
        {
            var updated = await _adminUserService.UpdateUserRoleByAdminAsync(id, request.RoleId, cancellationToken);
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
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleUserStatus(int id, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        if (!User.IsInRole("Admin") && await IsTargetAdminAsync(id, cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Hospital Managers cannot change the status of Administrator accounts." });
        }

        try
        {
            var updated = await _adminUserService.ToggleUserStatusByAdminAsync(id, adminUserId, request.IsActive, cancellationToken);
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
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var adminUserId))
        {
            return Unauthorized();
        }

        if (!User.IsInRole("Admin") && await IsTargetAdminAsync(id, cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Hospital Managers cannot remove Administrator accounts." });
        }

        try
        {
            await _adminUserService.DeleteUserByAdminAsync(id, adminUserId, cancellationToken);
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

    private async Task<bool> IsTargetAdminAsync(int targetUserId, CancellationToken cancellationToken)
    {
        var users = await _adminUserService.GetAllUsersForAdminAsync(null, null, null, cancellationToken);
        var target = users.FirstOrDefault(u => u.UserId == targetUserId);
        return target != null && (target.RoleId == 1 || string.Equals(target.RoleName, "Admin", StringComparison.OrdinalIgnoreCase));
    }
}
