using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RentalWise.Application.DTOs.Maintenance;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Enum;
using RentalWise.Domain.Policies;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.Application.Services.Maintenance;

/// Persistence and authorisation for maintenance requests. The agent proposes; this is the
/// only thing that writes.

public interface IMaintenanceService
{
    Task<List<TenantPropertyDto>> GetLeasedPropertiesAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<MaintenanceCreateResultDto> CreateAsync(Guid userId, CreateMaintenanceRequestDto dto, CancellationToken cancellationToken = default);

    Task<List<MaintenanceRequestSummaryDto>> GetForTenantAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<List<MaintenanceRequestSummaryDto>> GetForLandlordAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<MaintenanceRequestDto?> GetByIdAsync(Guid userId, bool isLandlord, int id, CancellationToken cancellationToken = default);

    Task<MaintenanceRequestDto?> UpdateStatusAsync(Guid landlordUserId, int id, MaintenanceStatus status, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IMaintenanceService"/>
public class MaintenanceService : IMaintenanceService
{
    private readonly AppDbContext _context;
    private readonly MaintenanceAgentOptions _options;
    private readonly ILogger<MaintenanceService> _logger;

    public MaintenanceService(
        AppDbContext context,
        IOptions<MaintenanceAgentOptions> options,
        ILogger<MaintenanceService> logger)
    {
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<List<TenantPropertyDto>> GetLeasedPropertiesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        // Ignore the Property IsActive filter: a tenant still living in a delisted property
        // must be able to pick it when reporting a fault.
        return await _context.Leases
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(l => l.Tenant.UserId == userId && l.Tenant.IsActive)
            .Where(l => l.StartDate.Date <= today && l.EndDate.Date >= today)
            .OrderBy(l => l.Property.Name)
            .Select(l => new TenantPropertyDto
            {
                PropertyId = l.PropertyId,
                Name = l.Property.Name,
                Address = l.Property.Address,
                Suburb = l.Property.Suburb.Name,
                LeaseStartDate = l.StartDate,
                LeaseEndDate = l.EndDate
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<MaintenanceCreateResultDto> CreateAsync(
        Guid userId,
        CreateMaintenanceRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var lease = await MaintenanceAccess.FindCurrentLeaseAsync(_context, userId, dto.PropertyId, cancellationToken)
            ?? throw new MaintenanceAuthorizationException(
                "You do not have a current lease on that property, so you cannot report maintenance for it.");

        // Replay of an already-approved draft: return the original, write nothing.
        var existing = await FindByIdempotencyKeyAsync(lease.TenantId, dto.IdempotencyKey, cancellationToken);
        if (existing is not null)
        {
            _logger.LogInformation(
                "Idempotency key {Key} already created request {RequestId}; returning the original.",
                dto.IdempotencyKey, existing.Id);

            return new MaintenanceCreateResultDto
            {
                Request = MaintenanceMapping.ToDto(existing),
                WasExistingRequest = true,
                VerifiedInDatabase = true
            };
        }

        if (!dto.AllowDuplicate)
        {
            var similar = await FindSimilarOpenRequestAsync(lease.TenantId, dto.PropertyId, dto.Category, cancellationToken);
            if (similar is not null)
            {
                throw new DuplicateMaintenanceRequestException(
                    similar.Id,
                    $"You already have an open {dto.Category} request for this property " +
                    $"(\"{similar.Title}\", reported {similar.CreatedAtUtc:d MMM yyyy}).");
            }
        }

        // Escalation is recomputed here from the values the tenant approved. The client's
        // view of whether something is urgent is never trusted.
        var escalate = MaintenanceSafetyPolicy.RequiresUrgentEscalation(dto.Category, dto.Urgency);
        var escalationReason = MaintenanceSafetyPolicy.EscalationReason(dto.Category, dto.Urgency);

        var request = new MaintenanceRequest
        {
            PropertyId = dto.PropertyId,
            TenantId = lease.TenantId,
            ReportedByUserId = userId,
            Title = ClipRequired(dto.Title.Trim(), 200),
            Description = ClipRequired(dto.Description.Trim(), 4000),
            Category = dto.Category,
            Urgency = dto.Urgency,
            Status = MaintenanceStatus.Submitted,
            RequiresUrgentEscalation = escalate,
            EscalationReason = Clip(escalationReason, 500),
            AiCategory = dto.AiCategory,
            AiUrgency = dto.AiUrgency,
            AiSummary = Clip(dto.AiSummary, 1000),
            AiReasoning = Clip(dto.AiReasoning, 2000),
            AiConfidence = dto.AiConfidence is null ? null : Math.Clamp(dto.AiConfidence.Value, 0d, 1d),
            AiModel = Clip(dto.AiModel, 100),
            ProposedLandlordMessage = Clip(dto.ProposedLandlordMessage, 2000),
            AgentToolTrace = dto.AgentToolTrace,
            IdempotencyKey = dto.IdempotencyKey,
            CreatedAtUtc = DateTime.UtcNow
        };

        request.Events.Add(Event(MaintenanceEventType.Created, userId,
            $"Reported by tenant as {dto.Category}/{dto.Urgency}."));

        request.Events.Add(Event(MaintenanceEventType.Triaged, null,
            $"Agent ({dto.AiModel ?? "unknown model"}) assessed this as {dto.AiCategory}/{dto.AiUrgency}" +
            (dto.AiConfidence is null ? "." : $" with confidence {dto.AiConfidence:0.00}.")));

        if (dto.Category != dto.AiCategory || dto.Urgency != dto.AiUrgency)
        {
            request.Events.Add(Event(MaintenanceEventType.HumanOverrodeAgent, userId,
                $"Tenant changed the assessment from {dto.AiCategory}/{dto.AiUrgency} " +
                $"to {dto.Category}/{dto.Urgency} before approving."));
        }

        if (escalate)
        {
            request.Events.Add(Event(MaintenanceEventType.EscalationFlagged, null,
                escalationReason ?? "Flagged as urgent by safety policy."));
        }

        _context.MaintenanceRequests.Add(request);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            // Most likely the unique index on IdempotencyKey: two approvals raced. The
            // other one won, so return its request rather than failing the caller.
            var raced = await FindByIdempotencyKeyAsync(lease.TenantId, dto.IdempotencyKey, cancellationToken);
            if (raced is null)
                throw;

            _logger.LogInformation(ex,
                "Concurrent create for idempotency key {Key} resolved to request {RequestId}.",
                dto.IdempotencyKey, raced.Id);

            return new MaintenanceCreateResultDto
            {
                Request = MaintenanceMapping.ToDto(raced),
                WasExistingRequest = true,
                VerifiedInDatabase = true
            };
        }

        // Read the row back rather than returning the in-memory object, so the response
        // reflects what is actually stored. This is the verification step the UI reports.
        var saved = await LoadAsync(request.Id, cancellationToken);

        if (saved is null)
        {
            _logger.LogError("Maintenance request {RequestId} could not be read back after saving.", request.Id);
            throw new InvalidOperationException("The request was saved but could not be read back.");
        }

        _logger.LogInformation(
            "Created maintenance request {RequestId} for property {PropertyId} ({Category}/{Urgency}, escalated={Escalated}).",
            saved.Id, saved.PropertyId, saved.Category, saved.Urgency, saved.RequiresUrgentEscalation);

        return new MaintenanceCreateResultDto
        {
            Request = MaintenanceMapping.ToDto(saved),
            WasExistingRequest = false,
            VerifiedInDatabase = true
        };
    }

    public async Task<List<MaintenanceRequestSummaryDto>> GetForTenantAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tenant = await MaintenanceAccess.FindTenantAsync(_context, userId, cancellationToken);
        if (tenant is null)
            return new List<MaintenanceRequestSummaryDto>();

        var rows = await _context.MaintenanceRequests
            .AsNoTracking()
            .Include(r => r.Property)
            .Where(r => r.TenantId == tenant.Id)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(100)
            .ToListAsync(cancellationToken);

        return rows.Select(MaintenanceMapping.ToSummary).ToList();
    }

    public async Task<List<MaintenanceRequestSummaryDto>> GetForLandlordAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var propertyIds = await OwnedPropertyIdsAsync(userId, cancellationToken);
        if (propertyIds.Count == 0)
            return new List<MaintenanceRequestSummaryDto>();

        var rows = await _context.MaintenanceRequests
            .AsNoTracking()
            .Include(r => r.Property)
            .Include(r => r.Tenant)
                .ThenInclude(t => t.User)
            .Where(r => propertyIds.Contains(r.PropertyId))
            // Urgent first, then newest, which is the order a landlord needs to triage in.
            .OrderByDescending(r => r.RequiresUrgentEscalation)
            .ThenByDescending(r => r.Urgency)
            .ThenByDescending(r => r.CreatedAtUtc)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(MaintenanceMapping.ToSummary).ToList();
    }

    public async Task<MaintenanceRequestDto?> GetByIdAsync(
        Guid userId,
        bool isLandlord,
        int id,
        CancellationToken cancellationToken = default)
    {
        var request = await LoadAsync(id, cancellationToken);
        if (request is null)
            return null;

        if (isLandlord)
        {
            if (!await MaintenanceAccess.OwnsPropertyAsync(_context, userId, request.PropertyId, cancellationToken))
                throw new MaintenanceAuthorizationException("That maintenance request belongs to another landlord's property.");
        }
        else
        {
            var tenant = await MaintenanceAccess.FindTenantAsync(_context, userId, cancellationToken);
            if (tenant is null || request.TenantId != tenant.Id)
                throw new MaintenanceAuthorizationException("That maintenance request was reported by another tenant.");
        }

        return MaintenanceMapping.ToDto(request);
    }

    public async Task<MaintenanceRequestDto?> UpdateStatusAsync(
        Guid landlordUserId,
        int id,
        MaintenanceStatus status,
        CancellationToken cancellationToken = default)
    {
        var request = await _context.MaintenanceRequests
            .Include(r => r.Events)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (request is null)
            return null;

        if (!await MaintenanceAccess.OwnsPropertyAsync(_context, landlordUserId, request.PropertyId, cancellationToken))
            throw new MaintenanceAuthorizationException("That maintenance request belongs to another landlord's property.");

        if (request.Status == status)
            return MaintenanceMapping.ToDto(request);

        var previous = request.Status;
        request.Status = status;
        request.UpdatedAtUtc = DateTime.UtcNow;

        request.Events.Add(Event(MaintenanceEventType.StatusChanged, landlordUserId,
            $"Status changed from {previous} to {status}."));

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await LoadAsync(id, cancellationToken);
        return saved is null ? null : MaintenanceMapping.ToDto(saved);
    }

    // --- helpers ---

    private Task<MaintenanceRequest?> LoadAsync(int id, CancellationToken cancellationToken) =>
        _context.MaintenanceRequests
            .AsNoTracking()
            .Include(r => r.Events)
            .Include(r => r.Property)
            .Include(r => r.Tenant)
                .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    private Task<MaintenanceRequest?> FindByIdempotencyKeyAsync(
        Guid tenantId,
        Guid idempotencyKey,
        CancellationToken cancellationToken) =>
        _context.MaintenanceRequests
            .AsNoTracking()
            .Include(r => r.Events)
            .Include(r => r.Property)
            .FirstOrDefaultAsync(r => r.IdempotencyKey == idempotencyKey && r.TenantId == tenantId, cancellationToken);

    private Task<MaintenanceRequest?> FindSimilarOpenRequestAsync(
        Guid tenantId,
        int propertyId,
        MaintenanceCategory category,
        CancellationToken cancellationToken)
    {
        var since = DateTime.UtcNow.AddDays(-_options.DuplicateLookbackDays);

        return _context.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId
                        && r.PropertyId == propertyId
                        && r.Category == category
                        && r.CreatedAtUtc >= since
                        && MaintenanceRequest.OpenStatuses.Contains(r.Status))
            .OrderByDescending(r => r.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private Task<List<int>> OwnedPropertyIdsAsync(Guid userId, CancellationToken cancellationToken) =>
        _context.Properties
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

    private static MaintenanceRequestEvent Event(MaintenanceEventType type, Guid? actorUserId, string detail) => new()
    {
        EventType = type,
        ActorUserId = actorUserId,
        Detail = Clip(detail, 2000),
        CreatedAtUtc = DateTime.UtcNow
    };

    private static string ClipRequired(string value, int max) =>
        value.Length <= max ? value : value[..max];

    private static string? Clip(string? value, int max) =>
        value is null ? null : ClipRequired(value, max);
}
