using System.Security.Claims;
using HospitalManagement.Application.Admin.Services;
using HospitalManagement.Application.Auth.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,HospitalManager")]
[Route("api/v1/Admin/users")]
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
    public async Task<IActionResult> CreateUser([FromBody] CreateUserByAdminRequest request, CancellationToken cancellationToken)
    {
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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserByAdminRequest request, CancellationToken cancellationToken)
    {
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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
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
}
