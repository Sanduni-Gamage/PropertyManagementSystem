namespace RentalWise.Domain.Enum;

/// <summary>
/// How quickly an issue needs attention. Stored as int; ordered so comparisons
/// (for example <c>urgency >= MaintenanceUrgency.High</c>) are meaningful.
/// </summary>
public enum MaintenanceUrgency
{
    Unknown = 0,

    /// <summary>Cosmetic or non-disruptive; can wait for a routine visit.</summary>
    Low = 1,

    /// <summary>Inconvenient but the property remains habitable.</summary>
    Medium = 2,

    /// <summary>Affects habitability or will worsen quickly if left.</summary>
    High = 3,

    /// <summary>Immediate risk to health, safety or the building.</summary>
    Emergency = 4
}
