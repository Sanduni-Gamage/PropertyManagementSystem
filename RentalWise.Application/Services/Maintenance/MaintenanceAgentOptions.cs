namespace RentalWise.Application.Services.Maintenance;

/// <summary>
/// Agent behaviour, bound from the "MaintenanceAgent" configuration section.
/// </summary>
public sealed class MaintenanceAgentOptions
{
    public const string SectionName = "MaintenanceAgent";

    /// <summary>
    /// How many rounds of tool calling to allow before forcing the agent to conclude.
    /// Two tools means a well-behaved run needs one or two rounds; the cap stops a
    /// malfunctioning model from looping on the database at our expense.
    /// </summary>
    public int MaxToolIterations { get; set; } = 4;

    /// <summary>Hard cap on tool calls across the whole run, independent of iterations.</summary>
    public int MaxTotalToolCalls { get; set; } = 8;

    /// <summary>
    /// How far back to look when deciding whether an issue has already been reported.
    /// </summary>
    public int DuplicateLookbackDays { get; set; } = 30;

    /// <summary>
    /// Allow one corrective retry when the model's structured output fails validation.
    /// </summary>
    public bool RetryOnInvalidJson { get; set; } = true;
}
