namespace RentalWise.Domain.Enum;

/// <summary>
/// Lifecycle of a tenant's application for a rental. Stored as int.
/// </summary>
public enum RentalApplicationStatus
{
    /// <summary>Tenant has applied; the landlord has not decided yet.</summary>
    Submitted = 1,

    /// <summary>Landlord offered the tenancy, which created the lease.</summary>
    Approved = 2,

    /// <summary>Landlord turned the application down.</summary>
    Declined = 3,

    /// <summary>Tenant pulled the application before a decision.</summary>
    Withdrawn = 4
}
