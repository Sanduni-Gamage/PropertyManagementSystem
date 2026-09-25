namespace RentalWise.Domain.Enum;

/// <summary>
/// Classification of a maintenance issue. Stored as int, so existing values must not be
/// renumbered. <see cref="Unknown"/> is the safe default when the agent cannot classify.
/// </summary>
public enum MaintenanceCategory
{
    Unknown = 0,
    Plumbing = 1,
    Flooding = 2,
    Electrical = 3,
    GasOrFumes = 4,
    HeatingCooling = 5,
    Appliance = 6,
    StructuralOrRoof = 7,
    PestControl = 8,
    LocksAndSecurity = 9,
    SmokeAlarm = 10,
    Grounds = 11,
    Other = 99
}
