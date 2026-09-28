using RentalWise.Domain.Enum;

namespace RentalWise.Application.DTOs.Applications;

/// <summary>A tenant applying for a listing.</summary>
public class CreateRentalApplicationDto
{
    public int PropertyId { get; set; }

    /// <summary>Optional note to the landlord.</summary>
    public string? Message { get; set; }
}

/// <summary>
/// A landlord offering the tenancy. All three lease terms are optional and default from the
/// listing, so the common case is a single click.
/// </summary>
public class ApproveRentalApplicationDto
{
    /// <summary>
    /// Lease start. Defaults to today.
    ///
    /// Note that a lease starting in the future is not yet "current", and maintenance
    /// reporting is gated on holding a current lease - so a future start date means the
    /// tenant cannot report maintenance until it arrives.
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>Lease end. Defaults to twelve months after the start date.</summary>
    public DateTime? EndDate { get; set; }

    /// <summary>Weekly rent. Defaults to the listing's advertised rent.</summary>
    public decimal? RentAmount { get; set; }

    /// <summary>Optional note to the tenant.</summary>
    public string? Note { get; set; }
}

/// <summary>A landlord declining an application.</summary>
public class DeclineRentalApplicationDto
{
    public string? Note { get; set; }
}

/// <summary>Read model for an application, from either side.</summary>
public class RentalApplicationDto
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    /// <summary>Null when the listing has since been delisted.</summary>
    public string? PropertyName { get; set; }

    public string? PropertyAddress { get; set; }

    public string? PropertySuburb { get; set; }

    public decimal? PropertyRentAmount { get; set; }

    public Guid TenantId { get; set; }

    /// <summary>Applicant's name if they have filled in their profile, otherwise null.</summary>
    public string? ApplicantName { get; set; }

    /// <summary>Applicant's email, shown to the landlord so they can make contact.</summary>
    public string? ApplicantEmail { get; set; }

    public string? ApplicantPhone { get; set; }

    public string? Message { get; set; }

    public RentalApplicationStatus Status { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? DecidedAtUtc { get; set; }

    public string? DecisionNote { get; set; }

    public int? LeaseId { get; set; }

    public DateTime? LeaseStartDate { get; set; }

    public DateTime? LeaseEndDate { get; set; }

    /// <summary>
    /// True when the lease exists and covers today, which is the condition the tenant needs
    /// to satisfy before they can report maintenance.
    /// </summary>
    public bool LeaseIsCurrent { get; set; }
}
