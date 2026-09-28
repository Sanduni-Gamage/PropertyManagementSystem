using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RentalWise.Application.DTOs.Applications;
using RentalWise.Application.Services.Maintenance;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Enum;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.Application.Services.Applications;

/// <summary>
/// Tenancy applications, and the approval that turns one into a lease.
/// </summary>
public interface IRentalApplicationService
{
    Task<RentalApplicationDto> ApplyAsync(Guid userId, CreateRentalApplicationDto dto, CancellationToken cancellationToken = default);

    Task<List<RentalApplicationDto>> GetMineAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<List<RentalApplicationDto>> GetForLandlordAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<RentalApplicationDto?> ApproveAsync(Guid landlordUserId, int applicationId, ApproveRentalApplicationDto dto, CancellationToken cancellationToken = default);

    Task<RentalApplicationDto?> DeclineAsync(Guid landlordUserId, int applicationId, DeclineRentalApplicationDto dto, CancellationToken cancellationToken = default);

    Task<RentalApplicationDto?> WithdrawAsync(Guid userId, int applicationId, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IRentalApplicationService"/>
public class RentalApplicationService : IRentalApplicationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<RentalApplicationService> _logger;

    public RentalApplicationService(AppDbContext context, ILogger<RentalApplicationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<RentalApplicationDto> ApplyAsync(
        Guid userId,
        CreateRentalApplicationDto dto,
        CancellationToken cancellationToken = default)
    {
        var tenant = await MaintenanceAccess.FindTenantAsync(_context, userId, cancellationToken)
            ?? throw new MaintenanceAuthorizationException("Only a tenant can apply for a rental.");

        // Only live listings accept applications, so the IsActive filter is left in place here.
        var property = await _context.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == dto.PropertyId, cancellationToken)
            ?? throw new RentalApplicationException("That listing is no longer available.");

        if (property.UserId == userId)
            throw new RentalApplicationException("You cannot apply for your own listing.");

        var alreadyOpen = await _context.RentalApplications
            .AsNoTracking()
            .AnyAsync(a => a.PropertyId == dto.PropertyId
                           && a.TenantId == tenant.Id
                           && RentalApplication.OpenStatuses.Contains(a.Status),
                cancellationToken);

        if (alreadyOpen)
            throw new RentalApplicationException("You have already applied for this property.");

        var existingLease = await MaintenanceAccess.FindCurrentLeaseAsync(_context, userId, dto.PropertyId, cancellationToken);
        if (existingLease is not null)
            throw new RentalApplicationException("You already hold a current lease on this property.");

        var application = new RentalApplication
        {
            PropertyId = dto.PropertyId,
            TenantId = tenant.Id,
            ApplicantUserId = userId,
            Message = Clip(dto.Message?.Trim(), 1000),
            Status = RentalApplicationStatus.Submitted,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.RentalApplications.Add(application);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Tenant {TenantId} applied for property {PropertyId} (application {ApplicationId}).",
            tenant.Id, dto.PropertyId, application.Id);

        var saved = await LoadAsync(application.Id, cancellationToken);
        return ToDto(saved!);
    }

    public async Task<List<RentalApplicationDto>> GetMineAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tenant = await MaintenanceAccess.FindTenantAsync(_context, userId, cancellationToken);
        if (tenant is null)
            return new List<RentalApplicationDto>();

        var rows = await BaseQuery()
            .Where(a => a.TenantId == tenant.Id)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(ToDto).ToList();
    }

    public async Task<List<RentalApplicationDto>> GetForLandlordAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var propertyIds = await _context.Properties
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        if (propertyIds.Count == 0)
            return new List<RentalApplicationDto>();

        var rows = await BaseQuery()
            .Where(a => propertyIds.Contains(a.PropertyId))
            // Undecided applications first - that is the landlord's actual work queue.
            .OrderBy(a => a.Status == RentalApplicationStatus.Submitted ? 0 : 1)
            .ThenByDescending(a => a.CreatedAtUtc)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(ToDto).ToList();
    }

    public async Task<RentalApplicationDto?> ApproveAsync(
        Guid landlordUserId,
        int applicationId,
        ApproveRentalApplicationDto dto,
        CancellationToken cancellationToken = default)
    {
        var application = await _context.RentalApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken);

        if (application is null)
            return null;

        await EnsureLandlordOwnsAsync(landlordUserId, application.PropertyId, cancellationToken);

        if (application.Status != RentalApplicationStatus.Submitted)
            throw new RentalApplicationException($"This application has already been {application.Status.ToString().ToLowerInvariant()}.");

        var property = await _context.Properties
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == application.PropertyId, cancellationToken)
            ?? throw new RentalApplicationException("That listing no longer exists.");

        // Default to a lease that starts today, so the tenancy is immediately current.
        // A future start date leaves the tenant unable to report maintenance until it
        // arrives, which is correct but surprising, so it is never the default.
        var start = (dto.StartDate ?? DateTime.UtcNow).Date;
        var end = (dto.EndDate ?? start.AddMonths(12)).Date;

        if (end <= start)
            throw new RentalApplicationException("The lease end date must be after the start date.");

        var rent = dto.RentAmount ?? property.RentAmount;
        if (rent < 0)
            throw new RentalApplicationException("Rent cannot be negative.");

        var lease = new Lease
        {
            PropertyId = application.PropertyId,
            TenantId = application.TenantId,
            StartDate = start,
            EndDate = end,
            RentAmount = rent,
            Notes = $"Created by approving application #{application.Id}.",
            CreatedAt = DateTime.UtcNow
        };

        _context.Leases.Add(lease);

        // Save first so the lease has an id to point the application at.
        await _context.SaveChangesAsync(cancellationToken);

        application.Status = RentalApplicationStatus.Approved;
        application.DecidedAtUtc = DateTime.UtcNow;
        application.DecidedByUserId = landlordUserId;
        application.DecisionNote = Clip(dto.Note?.Trim(), 500);
        application.LeaseId = lease.Id;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Application {ApplicationId} approved by {LandlordUserId}; lease {LeaseId} runs {Start:yyyy-MM-dd} to {End:yyyy-MM-dd}.",
            application.Id, landlordUserId, lease.Id, start, end);

        var saved = await LoadAsync(application.Id, cancellationToken);
        return saved is null ? null : ToDto(saved);
    }

    public async Task<RentalApplicationDto?> DeclineAsync(
        Guid landlordUserId,
        int applicationId,
        DeclineRentalApplicationDto dto,
        CancellationToken cancellationToken = default)
    {
        var application = await _context.RentalApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken);

        if (application is null)
            return null;

        await EnsureLandlordOwnsAsync(landlordUserId, application.PropertyId, cancellationToken);

        if (application.Status != RentalApplicationStatus.Submitted)
            throw new RentalApplicationException($"This application has already been {application.Status.ToString().ToLowerInvariant()}.");

        application.Status = RentalApplicationStatus.Declined;
        application.DecidedAtUtc = DateTime.UtcNow;
        application.DecidedByUserId = landlordUserId;
        application.DecisionNote = Clip(dto.Note?.Trim(), 500);

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await LoadAsync(application.Id, cancellationToken);
        return saved is null ? null : ToDto(saved);
    }

    public async Task<RentalApplicationDto?> WithdrawAsync(
        Guid userId,
        int applicationId,
        CancellationToken cancellationToken = default)
    {
        var tenant = await MaintenanceAccess.FindTenantAsync(_context, userId, cancellationToken)
            ?? throw new MaintenanceAuthorizationException("Only a tenant can withdraw an application.");

        var application = await _context.RentalApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken);

        if (application is null)
            return null;

        if (application.TenantId != tenant.Id)
            throw new MaintenanceAuthorizationException("That application belongs to another tenant.");

        if (application.Status != RentalApplicationStatus.Submitted)
            throw new RentalApplicationException($"This application has already been {application.Status.ToString().ToLowerInvariant()}.");

        application.Status = RentalApplicationStatus.Withdrawn;
        application.DecidedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var saved = await LoadAsync(application.Id, cancellationToken);
        return saved is null ? null : ToDto(saved);
    }

    // --- helpers ---

    private async Task EnsureLandlordOwnsAsync(Guid landlordUserId, int propertyId, CancellationToken cancellationToken)
    {
        if (!await MaintenanceAccess.OwnsPropertyAsync(_context, landlordUserId, propertyId, cancellationToken))
            throw new MaintenanceAuthorizationException("That application is for another landlord's property.");
    }

    /// <summary>
    /// Shared projection graph. Query filters are ignored so a delisted listing still
    /// resolves its name and address for display.
    /// </summary>
    private IQueryable<RentalApplication> BaseQuery() =>
        _context.RentalApplications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(a => a.Property)
                .ThenInclude(p => p!.Suburb)
            .Include(a => a.Tenant)
                .ThenInclude(t => t.User)
            .Include(a => a.Lease);

    private Task<RentalApplication?> LoadAsync(int id, CancellationToken cancellationToken) =>
        BaseQuery().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    private static RentalApplicationDto ToDto(RentalApplication a)
    {
        var today = DateTime.UtcNow.Date;

        var name = string.Join(' ', new[] { a.Tenant?.FirstName, a.Tenant?.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part))).Trim();

        return new RentalApplicationDto
        {
            Id = a.Id,
            PropertyId = a.PropertyId,
            PropertyName = a.Property?.Name,
            PropertyAddress = a.Property?.Address,
            PropertySuburb = a.Property?.Suburb?.Name,
            PropertyRentAmount = a.Property?.RentAmount,
            TenantId = a.TenantId,
            ApplicantName = string.IsNullOrWhiteSpace(name) ? null : name,
            ApplicantEmail = a.Tenant?.User?.Email,
            ApplicantPhone = a.Tenant?.PhoneNumber,
            Message = a.Message,
            Status = a.Status,
            StatusName = a.Status.ToString(),
            CreatedAtUtc = a.CreatedAtUtc,
            DecidedAtUtc = a.DecidedAtUtc,
            DecisionNote = a.DecisionNote,
            LeaseId = a.LeaseId,
            LeaseStartDate = a.Lease?.StartDate,
            LeaseEndDate = a.Lease?.EndDate,
            LeaseIsCurrent = a.Lease is not null
                             && a.Lease.StartDate.Date <= today
                             && a.Lease.EndDate.Date >= today
        };
    }

    private static string? Clip(string? value, int max) =>
        value is null || value.Length <= max ? value : value[..max];
}

/// <summary>
/// The request is understood but not allowed in the current state - already applied,
/// already decided, own listing. Mapped to 400 by the controller.
/// </summary>
public class RentalApplicationException : Exception
{
    public RentalApplicationException(string message) : base(message) { }
}
