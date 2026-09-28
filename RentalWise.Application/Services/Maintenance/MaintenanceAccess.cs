using Microsoft.EntityFrameworkCore;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.Application.Services.Maintenance;

/// <summary>
/// The one place that answers "is this user allowed to touch this property's maintenance?".
///
/// It exists because the rule is subtle and is needed by the endpoint, the agent and each
/// tool: <see cref="Tenant.Id"/> is a generated key, not the Identity user id, so
/// <see cref="Lease.TenantId"/> can never be compared against a user id directly. Keeping
/// it in one place stops the three call sites from drifting apart.
/// </summary>
internal static class MaintenanceAccess
{
    /// <summary>Resolves an Identity user id to their active tenant profile.</summary>
    public static Task<Tenant?> FindTenantAsync(
        AppDbContext context,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId && t.IsActive, cancellationToken);

    /// <summary>
    /// The tenant's lease on a property that covers today, or null if they have none.
    /// A tenant with no current lease has no business reporting faults on the property.
    /// </summary>
    public static Task<Lease?> FindCurrentLeaseAsync(
        AppDbContext context,
        Guid userId,
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        return context.Leases
            .AsNoTracking()
            .Where(l => l.PropertyId == propertyId)
            .Where(l => l.Tenant.UserId == userId && l.Tenant.IsActive)
            .Where(l => l.StartDate.Date <= today && l.EndDate.Date >= today)
            .OrderByDescending(l => l.StartDate)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// True when the user owns the property the request sits on. Used for the landlord's
    /// read and status-update paths. Query filters are ignored so delisting a property does
    /// not silently revoke the landlord's access to its maintenance history.
    /// </summary>
    public static Task<bool> OwnsPropertyAsync(
        AppDbContext context,
        Guid userId,
        int propertyId,
        CancellationToken cancellationToken = default) =>
        context.Properties
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(p => p.Id == propertyId && p.UserId == userId, cancellationToken);
}
