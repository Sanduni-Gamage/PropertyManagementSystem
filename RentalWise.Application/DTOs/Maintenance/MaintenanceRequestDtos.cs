using RentalWise.Domain.Enum;

namespace RentalWise.Application.DTOs.Maintenance;

/// <summary>
/// The tenant's approval of an agent draft. Category and urgency are whatever the tenant
/// confirmed, which may differ from what the agent proposed; both are recorded.
///
/// The client supplying the AI fields is intentional: they are audit metadata, not inputs to
/// a decision. Escalation is recomputed server-side from the approved category and urgency,
/// so a client cannot talk the system out of escalating.
/// </summary>
public class CreateMaintenanceRequestDto
{
    public int PropertyId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    // Values the tenant approved - these are what the system acts on.
    public MaintenanceCategory Category { get; set; }

    public MaintenanceUrgency Urgency { get; set; }

    // The agent's original assessment, kept for audit.
    public MaintenanceCategory AiCategory { get; set; }

    public MaintenanceUrgency AiUrgency { get; set; }

    public string? AiSummary { get; set; }

    public string? AiReasoning { get; set; }

    public double? AiConfidence { get; set; }

    public string? AiModel { get; set; }

    public string? ProposedLandlordMessage { get; set; }

    /// <summary>JSON tool trace from the triage response, stored verbatim.</summary>
    public string? AgentToolTrace { get; set; }

    /// <summary>Issued by the triage call; replaying it is a no-op rather than a duplicate.</summary>
    public Guid IdempotencyKey { get; set; }

    /// <summary>
    /// Set true to proceed when the server has already flagged a similar open request.
    /// Without it, a near-duplicate is rejected with 409 and the existing request's id.
    /// </summary>
    public bool AllowDuplicate { get; set; }
}

/// <summary>Full read model for a maintenance request, including its audit timeline.</summary>
public class MaintenanceRequestDto
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    /// <summary>Null when the property has since been delisted.</summary>
    public string? PropertyName { get; set; }

    public string? PropertyAddress { get; set; }

    public Guid TenantId { get; set; }

    /// <summary>Reporter's name if their profile has one. Shown to the landlord.</summary>
    public string? TenantName { get; set; }

    public string? TenantEmail { get; set; }

    public string? TenantPhone { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public MaintenanceCategory Category { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public MaintenanceUrgency Urgency { get; set; }

    public string UrgencyName { get; set; } = string.Empty;

    public MaintenanceStatus Status { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public bool RequiresUrgentEscalation { get; set; }

    public string? EscalationReason { get; set; }

    public MaintenanceCategory AiCategory { get; set; }

    public MaintenanceUrgency AiUrgency { get; set; }

    /// <summary>True when the tenant changed the agent's category or urgency before approving.</summary>
    public bool TenantOverrodeAgent { get; set; }

    public string? AiSummary { get; set; }

    public string? AiReasoning { get; set; }

    public double? AiConfidence { get; set; }

    public string? AiModel { get; set; }

    public string? ProposedLandlordMessage { get; set; }

    /// <summary>
    /// JSON array of the tool calls the agent made while triaging, so the landlord can see
    /// what it actually looked up rather than taking the assessment on trust.
    ///
    /// Safe to show the landlord: the tools only ever returned details of this property and
    /// this tenant's requests against it, all of which the landlord can already see.
    /// </summary>
    public string? AgentToolTrace { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public List<MaintenanceRequestEventDto> Events { get; set; } = new();
}

/// <summary>Compact form used in lists and duplicate warnings.</summary>
public class MaintenanceRequestSummaryDto
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    /// <summary>Listing name, so a landlord's list is readable without a second call.</summary>
    public string? PropertyName { get; set; }

    /// <summary>Reporter's name, for the landlord's queue.</summary>
    public string? TenantName { get; set; }

    public string Title { get; set; } = string.Empty;

    public MaintenanceCategory Category { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public MaintenanceUrgency Urgency { get; set; }

    public string UrgencyName { get; set; } = string.Empty;

    public MaintenanceStatus Status { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public bool RequiresUrgentEscalation { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>One entry on a request's audit timeline.</summary>
public class MaintenanceRequestEventDto
{
    public int Id { get; set; }

    public MaintenanceEventType EventType { get; set; }

    public string EventTypeName { get; set; } = string.Empty;

    public string? Detail { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>
/// Result of a create call. <see cref="WasExistingRequest"/> is true when the idempotency
/// key had already been used, meaning nothing new was written.
/// </summary>
public class MaintenanceCreateResultDto
{
    public MaintenanceRequestDto Request { get; set; } = new();

    public bool WasExistingRequest { get; set; }

    /// <summary>
    /// Confirmation that the row was read back from the database after writing, rather than
    /// echoed from memory. Surfaced in the UI as the verification step.
    /// </summary>
    public bool VerifiedInDatabase { get; set; }
}

/// <summary>A landlord's status change on a request.</summary>
public class UpdateMaintenanceStatusDto
{
    public MaintenanceStatus Status { get; set; }
}

/// <summary>A property the signed-in tenant currently leases, for the issue-reporting picker.</summary>
public class TenantPropertyDto
{
    public int PropertyId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? Suburb { get; set; }

    public DateTime LeaseStartDate { get; set; }

    public DateTime LeaseEndDate { get; set; }
}
