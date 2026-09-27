using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RentalWise.Application.DTOs.Applications;
using RentalWise.Application.Services.Applications;
using RentalWise.Application.Services.Maintenance;

namespace RentalWise.API.Controllers;

/// <summary>
/// Tenancy applications. A tenant applies for a listing; the landlord offers or declines.
/// Approving an application is what creates the lease, which in turn is what lets the
/// tenant report maintenance.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IRentalApplicationService _service;

    public ApplicationsController(IRentalApplicationService service)
    {
        _service = service;
    }

    /// <summary>Tenant applies for a listing.</summary>
    [HttpPost]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<RentalApplicationDto>> Apply(
        [FromBody] CreateRentalApplicationDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var created = await _service.ApplyAsync(userId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetMine), new { }, created);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
        catch (RentalApplicationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>The signed-in tenant's own applications.</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<List<RentalApplicationDto>>> GetMine(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        return Ok(await _service.GetMineAsync(userId, cancellationToken));
    }

    /// <summary>Applications across all of the signed-in landlord's listings.</summary>
    [HttpGet]
    [Authorize(Roles = "Landlord")]
    public async Task<ActionResult<List<RentalApplicationDto>>> GetForLandlord(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        return Ok(await _service.GetForLandlordAsync(userId, cancellationToken));
    }

    /// <summary>
    /// Landlord offers the tenancy. This creates the lease - lease terms default from the
    /// listing, so an empty body is the normal case.
    /// </summary>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Landlord")]
    public async Task<ActionResult<RentalApplicationDto>> Approve(
        int id,
        [FromBody] ApproveRentalApplicationDto? dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var updated = await _service.ApproveAsync(userId, id, dto ?? new ApproveRentalApplicationDto(), cancellationToken);
            return updated is null ? NotFound("Application not found.") : Ok(updated);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
        catch (RentalApplicationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Landlord declines the application.</summary>
    [HttpPost("{id:int}/decline")]
    [Authorize(Roles = "Landlord")]
    public async Task<ActionResult<RentalApplicationDto>> Decline(
        int id,
        [FromBody] DeclineRentalApplicationDto? dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var updated = await _service.DeclineAsync(userId, id, dto ?? new DeclineRentalApplicationDto(), cancellationToken);
            return updated is null ? NotFound("Application not found.") : Ok(updated);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
        catch (RentalApplicationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Tenant withdraws an application that has not been decided yet.</summary>
    [HttpPost("{id:int}/withdraw")]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<RentalApplicationDto>> Withdraw(int id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var updated = await _service.WithdrawAsync(userId, id, cancellationToken);
            return updated is null ? NotFound("Application not found.") : Ok(updated);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
        catch (RentalApplicationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    /// <summary>
    /// 403 with an explanation. ControllerBase.Forbid() takes authentication scheme names,
    /// not a message, so it cannot carry the reason.
    /// </summary>
    private ObjectResult Denied(MaintenanceAuthorizationException ex) =>
        StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
}
