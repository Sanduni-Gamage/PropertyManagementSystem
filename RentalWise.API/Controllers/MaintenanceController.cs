using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalWise.Application.DTOs.Maintenance;
using RentalWise.Application.Services.Maintenance;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.API.Controllers;

/// <summary>
/// Tenant-facing maintenance reporting, backed by the AI triage agent, plus the landlord's
/// view of what has been reported.
///
/// The split between <see cref="Triage"/> and <see cref="Create"/> is the point of the
/// design: triage is read-only and produces a proposal, and nothing is written until the
/// tenant approves that proposal on a separate call.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceAgent _agent;
    private readonly IMaintenanceService _service;
    private readonly AppDbContext _context;
    private readonly ILogger<MaintenanceController> _logger;

    public MaintenanceController(
        IMaintenanceAgent agent,
        IMaintenanceService service,
        AppDbContext context,
        ILogger<MaintenanceController> logger)
    {
        _agent = agent;
        _service = service;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Properties the signed-in tenant currently leases, for the reporting form's picker.
    /// </summary>
    [HttpGet("my-properties")]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<List<TenantPropertyDto>>> GetMyProperties(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        return Ok(await _service.GetLeasedPropertiesAsync(userId, cancellationToken));
    }

    /// <summary>
    /// Runs the agent over the tenant's description. Read-only: this writes nothing and
    /// returns a draft for the tenant to approve, reject or correct.
    /// </summary>
    [HttpPost("triage")]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<MaintenanceTriageResultDto>> Triage(
        [FromBody] MaintenanceTriageRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            return Ok(await _agent.TriageAsync(userId, dto, cancellationToken));
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
        catch (AgentAssessmentException ex)
        {
            // Upstream model failure, not the caller's fault.
            _logger.LogWarning(ex, "Triage failed for property {PropertyId}.", dto.PropertyId);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Creates the request the tenant approved. Idempotent on
    /// <see cref="CreateMaintenanceRequestDto.IdempotencyKey"/>, and rejects a near-duplicate
    /// with 409 unless the tenant explicitly opts in.
    /// </summary>
    [HttpPost("requests")]
    [Authorize(Roles = "Tenant")]
    public async Task<ActionResult<MaintenanceCreateResultDto>> Create(
        [FromBody] CreateMaintenanceRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var result = await _service.CreateAsync(userId, dto, cancellationToken);

            // A replayed key wrote nothing, so 200 rather than 201 is the honest answer.
            if (result.WasExistingRequest)
                return Ok(result);

            return CreatedAtAction(nameof(GetById), new { id = result.Request.Id }, result);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
        catch (DuplicateMaintenanceRequestException ex)
        {
            return Conflict(new
            {
                message = ex.Message,
                existingRequestId = ex.ExistingRequestId,
                hint = "Submit again with allowDuplicate: true to report it anyway."
            });
        }
    }

    /// <summary>
    /// Requests visible to the caller: their own if they are a tenant, everything on their
    /// properties if they are a landlord.
    /// </summary>
    [HttpGet("requests")]
    public async Task<ActionResult<List<MaintenanceRequestSummaryDto>>> GetRequests(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        return Ok(User.IsInRole("Landlord")
            ? await _service.GetForLandlordAsync(userId, cancellationToken)
            : await _service.GetForTenantAsync(userId, cancellationToken));
    }

    /// <summary>One request in full, including its audit timeline.</summary>
    [HttpGet("requests/{id:int}")]
    public async Task<ActionResult<MaintenanceRequestDto>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var request = await _service.GetByIdAsync(userId, User.IsInRole("Landlord"), id, cancellationToken);
            return request is null ? NotFound("Maintenance request not found.") : Ok(request);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
    }

    /// <summary>Landlord moves a request along its lifecycle.</summary>
    [HttpPatch("requests/{id:int}/status")]
    [Authorize(Roles = "Landlord")]
    public async Task<ActionResult<MaintenanceRequestDto>> UpdateStatus(
        int id,
        [FromBody] UpdateMaintenanceStatusDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        try
        {
            var updated = await _service.UpdateStatusAsync(userId, id, dto.Status, cancellationToken);
            return updated is null ? NotFound("Maintenance request not found.") : Ok(updated);
        }
        catch (MaintenanceAuthorizationException ex)
        {
            return Denied(ex);
        }
    }

    /// <summary>
    /// Development-only convenience: gives the signed-in tenant a 12-month lease on a
    /// property so the maintenance flow can be demonstrated.
    ///
    /// The project has no lease management UI yet, and maintenance reporting is gated on
    /// holding a current lease, so without this there is no way to reach the happy path by
    /// hand. Returns 404 outside Development. Safe to delete once leases can be created
    /// through the application.
    /// </summary>
    [HttpPost("dev/demo-lease")]
    [Authorize(Roles = "Tenant")]
    public async Task<IActionResult> SeedDemoLease(
        [FromQuery] int propertyId,
        [FromServices] IWebHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment())
            return NotFound();

        if (!TryGetUserId(out var userId))
            return Unauthorized("Invalid user ID.");

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);
        if (tenant is null)
            return BadRequest("No tenant profile found for this user.");

        var property = await _context.Properties
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == propertyId, cancellationToken);

        if (property is null)
            return NotFound($"Property {propertyId} does not exist.");

        var today = DateTime.UtcNow.Date;

        var existing = await _context.Leases.FirstOrDefaultAsync(
            l => l.TenantId == tenant.Id
                 && l.PropertyId == propertyId
                 && l.StartDate <= today
                 && l.EndDate >= today,
            cancellationToken);

        if (existing is not null)
            return Ok(new { leaseId = existing.Id, propertyId, created = false, message = "A current lease already exists." });

        var lease = new Lease
        {
            PropertyId = propertyId,
            TenantId = tenant.Id,
            StartDate = today.AddMonths(-1),
            EndDate = today.AddMonths(11),
            RentAmount = property.RentAmount,
            Notes = "Created by the development demo-lease endpoint.",
            CreatedAt = DateTime.UtcNow
        };

        _context.Leases.Add(lease);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogWarning(
            "Development demo lease {LeaseId} created for tenant {TenantId} on property {PropertyId}.",
            lease.Id, tenant.Id, propertyId);

        return Ok(new { leaseId = lease.Id, propertyId, created = true });
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    /// <summary>
    /// 403 with an explanation. ControllerBase.Forbid() takes authentication scheme names
    /// rather than a message, so it cannot carry the reason the caller was refused.
    /// </summary>
    private ObjectResult Denied(MaintenanceAuthorizationException ex) =>
        StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
}
