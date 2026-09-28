using RentalWise.Domain.Enum;

namespace RentalWise.Application.DTOs.Maintenance;

/// <summary>
/// What the tenant sends to have an issue triaged. Carries the whole short conversation so
/// the agent can ask a clarifying question and then be called again with the answer,
/// without the server holding session state.
/// </summary>
public class MaintenanceTriageRequestDto
{
    public int PropertyId { get; set; }

    public List<TriageMessageDto> Messages { get; set; } = new();
}

/// <summary>One turn of the triage conversation.</summary>
public class TriageMessageDto
{
    /// <summary>Either "tenant" or "agent". Anything else is treated as "tenant".</summary>
    public string Role { get; set; } = "tenant";

    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// The agent's assessment. Nothing here has been saved: this is a proposal the tenant must
/// approve. Enum values are sent as both the numeric value and a readable name, because the
/// API does not globally serialise enums as strings.
/// </summary>
public class MaintenanceTriageResultDto
{
    /// <summary>True when the agent cannot assess the issue without more detail.</summary>
    public bool NeedsMoreInfo { get; set; }

    /// <summary>Questions to put to the tenant. Empty when the assessment is complete.</summary>
    public List<string> FollowUpQuestions { get; set; } = new();

    public string ProposedTitle { get; set; } = string.Empty;

    public MaintenanceCategory Category { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public MaintenanceUrgency Urgency { get; set; }

    public string UrgencyName { get; set; } = string.Empty;

    /// <summary>One or two sentences restating the problem in plain language.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>Why the agent classified it this way, including what the tools told it.</summary>
    public string Reasoning { get; set; } = string.Empty;

    /// <summary>Model's self-reported confidence between 0 and 1. Advisory only.</summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Decided by <see cref="Domain.Policies.MaintenanceSafetyPolicy"/>, not by the model.
    /// </summary>
    public bool RequiresUrgentEscalation { get; set; }

    public string? EscalationReason { get; set; }

    /// <summary>Safety steps to show the tenant before anything else. Empty if not escalated.</summary>
    public List<string> SafetyAdvice { get; set; } = new();

    /// <summary>Draft message to the landlord, for the tenant to read before approving.</summary>
    public string ProposedLandlordMessage { get; set; } = string.Empty;

    /// <summary>
    /// Existing open requests that look like the same issue, found via the agent's tools.
    /// Shown so the tenant can decide not to report it twice.
    /// </summary>
    public List<MaintenanceRequestSummaryDto> PossibleDuplicates { get; set; } = new();

    /// <summary>
    /// Replay this on the create call. The unique index on it makes a double-submit return
    /// the original request rather than creating a second one.
    /// </summary>
    public Guid IdempotencyKey { get; set; }

    public string Model { get; set; } = string.Empty;

    /// <summary>The tool calls the agent made, in order, for the trace panel.</summary>
    public List<AgentToolCallDto> ToolCalls { get; set; } = new();
}

/// <summary>
/// One tool invocation, surfaced to the UI so the run is inspectable rather than opaque.
/// </summary>
public class AgentToolCallDto
{
    public string Name { get; set; } = string.Empty;

    public string Arguments { get; set; } = "{}";

    /// <summary>JSON the tool returned. Already scoped to what this tenant may see.</summary>
    public string Result { get; set; } = "{}";

    public long DurationMs { get; set; }

    public bool Succeeded { get; set; } = true;

    public string? Error { get; set; }
}
