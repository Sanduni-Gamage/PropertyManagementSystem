using RentalWise.Domain.Enum;

namespace RentalWise.Domain.Entities;

/// <summary>
/// A tenant's application for a rental listing.
///
/// Approving one is what creates a <see cref="Lease"/>, which is the record everything else
/// in the app keys off - including whether the tenant may report maintenance.
/// </summary>
public class RentalApplication
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    /// <summary>
    /// Nullable for the same reason as on <see cref="MaintenanceRequest"/>: Property carries
    /// a global IsActive filter, and an application must survive the listing being delisted.
    /// </summary>
    public Property? Property { get; set; }

    /// <summary>Tenant profile that applied (<see cref="Tenant.Id"/>, not the user id).</summary>
    public Guid TenantId { get; set; }

    public Tenant Tenant { get; set; } = null!;

    /// <summary>Identity user who applied, captured independently of the tenant profile.</summary>
    public Guid ApplicantUserId { get; set; }

    /// <summary>Optional note from the applicant to the landlord.</summary>
    public string? Message { get; set; }

    public RentalApplicationStatus Status { get; set; } = RentalApplicationStatus.Submitted;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DecidedAtUtc { get; set; }

    /// <summary>Identity user who approved or declined it.</summary>
    public Guid? DecidedByUserId { get; set; }

    /// <summary>Landlord's note accompanying the decision.</summary>
    public string? DecisionNote { get; set; }

    /// <summary>The lease created by approving this application; null until approved.</summary>
    public int? LeaseId { get; set; }

    public Lease? Lease { get; set; }

    /// <summary>Statuses where the landlord has not decided yet.</summary>
    public static readonly RentalApplicationStatus[] OpenStatuses =
    {
        RentalApplicationStatus.Submitted
    };
}
