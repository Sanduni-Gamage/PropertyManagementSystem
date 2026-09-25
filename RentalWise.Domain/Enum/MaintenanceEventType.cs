namespace RentalWise.Domain.Enum;

/// <summary>
/// Audit trail entry types for a maintenance request. Stored as int.
/// </summary>
public enum MaintenanceEventType
{
    /// <summary>Request was created after the tenant approved the agent's draft.</summary>
    Created = 1,

    /// <summary>The agent's assessment recorded against the request.</summary>
    Triaged = 2,

    /// <summary>Deterministic safety policy flagged this for urgent escalation.</summary>
    EscalationFlagged = 3,

    /// <summary>Status moved from one value to another.</summary>
    StatusChanged = 4,

    /// <summary>The tenant overrode the agent's category or urgency before approving.</summary>
    HumanOverrodeAgent = 5
}
