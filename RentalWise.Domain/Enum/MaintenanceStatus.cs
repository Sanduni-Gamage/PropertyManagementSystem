namespace RentalWise.Domain.Enum;

/// <summary>
/// Lifecycle of a maintenance request. Stored as int.
/// </summary>
public enum MaintenanceStatus
{
    /// <summary>Tenant has submitted it; the landlord has not responded yet.</summary>
    Submitted = 1,

    /// <summary>Landlord has seen it and accepted it as real work.</summary>
    Acknowledged = 2,

    /// <summary>Work is underway.</summary>
    InProgress = 3,

    /// <summary>Work is finished.</summary>
    Resolved = 4,

    /// <summary>Withdrawn by the tenant, or rejected as not actionable.</summary>
    Cancelled = 5
}
