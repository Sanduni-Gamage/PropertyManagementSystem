using RentalWise.Domain.Enum;

namespace RentalWise.Domain.Entities;

/// <summary>
/// A maintenance issue reported by a tenant against a property they lease.
///
/// A row only exists once the tenant has approved the agent's draft, so there is no
/// "draft" status: an unapproved assessment is never persisted. Both the agent's original
/// assessment and the values the tenant actually approved are stored, so a disagreement
/// between the two stays visible after the fact.
/// </summary>
public class MaintenanceRequest
{
    public int Id { get; set; }

    public int PropertyId { get; set; }

    /// <summary>
    /// The property the issue was reported against. Nullable even though
    /// <see cref="PropertyId"/> always points somewhere: <see cref="Property"/> carries a
    /// global <c>IsActive</c> query filter, so a delisted property is filtered out of
    /// reads while the request itself must still be returned.
    /// </summary>
    public Property? Property { get; set; }

    /// <summary>Tenant profile the request belongs to (<see cref="Tenant.Id"/>).</summary>
    public Guid TenantId { get; set; }

    public Tenant Tenant { get; set; } = null!;

    /// <summary>Identity user who submitted it, captured independently of the tenant profile.</summary>
    public Guid ReportedByUserId { get; set; }

    public string Title { get; set; } = null!;

    /// <summary>The tenant's own description of the problem, kept verbatim.</summary>
    public string Description { get; set; } = null!;

    // --- Approved values (what the system acts on) ---

    public MaintenanceCategory Category { get; set; }

    public MaintenanceUrgency Urgency { get; set; }

    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Submitted;

    /// <summary>
    /// Set by <see cref="Policies.MaintenanceSafetyPolicy"/> at creation time, not by the model.
    /// </summary>
    public bool RequiresUrgentEscalation { get; set; }

    public string? EscalationReason { get; set; }

    // --- Agent assessment (advisory, kept for audit) ---

    public MaintenanceCategory AiCategory { get; set; }

    public MaintenanceUrgency AiUrgency { get; set; }

    public string? AiSummary { get; set; }

    /// <summary>The model's stated reasoning for its classification.</summary>
    public string? AiReasoning { get; set; }

    /// <summary>Model's self-reported confidence, 0 to 1. Advisory only.</summary>
    public double? AiConfidence { get; set; }

    /// <summary>Which model produced the assessment, for example "gemini-2.5-flash".</summary>
    public string? AiModel { get; set; }

    /// <summary>Draft message to the landlord, prepared by the agent and approved by the tenant.</summary>
    public string? ProposedLandlordMessage { get; set; }

    /// <summary>
    /// JSON trace of the tool calls the agent made while triaging, stored so the run can be
    /// inspected without re-invoking the model.
    /// </summary>
    public string? AgentToolTrace { get; set; }

    // --- Idempotency and timestamps ---

    /// <summary>
    /// Issued with the triage result and replayed on approval. A unique index on this column
    /// makes a double-submit return the original request instead of creating a duplicate.
    /// </summary>
    public Guid IdempotencyKey { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<MaintenanceRequestEvent> Events { get; set; } = new List<MaintenanceRequestEvent>();

    /// <summary>Statuses that count as still needing attention, used for duplicate detection.</summary>
    public static readonly MaintenanceStatus[] OpenStatuses =
    {
        MaintenanceStatus.Submitted,
        MaintenanceStatus.Acknowledged,
        MaintenanceStatus.InProgress
    };
}
