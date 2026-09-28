using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RentalWise.Application.DTOs.Maintenance;
using RentalWise.Domain.Ai;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Enum;
using RentalWise.Domain.Policies;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.Application.Services.Maintenance;

/// <summary>
/// Triages a tenant's maintenance report. Read-only: it never writes a request.
/// </summary>
public interface IMaintenanceAgent
{
    Task<MaintenanceTriageResultDto> TriageAsync(
        Guid userId,
        MaintenanceTriageRequestDto request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// The agent loop.
///
/// It runs in two phases:
///
///   Phase A - the model is given the tools and talks freely until it stops asking for
///             them (or hits the iteration cap). This is where it gathers property details
///             and past requests.
///   Phase B - the accumulated conversation is replayed with no tools and a response schema
///             attached, so the final answer is machine-checkable rather than prose we have
///             to pattern-match.
///
/// Gemini 2.5 forced this split by rejecting a response schema and function declarations in
/// the same request. Gemini 3.x allows both, but the split is kept deliberately: the schema
/// is applied once the model has finished gathering context, so the answer is always
/// schema-valid no matter how many tool rounds came before it.
///
/// Everything the model returns is then re-validated, and the safety escalation is decided
/// by <see cref="MaintenanceSafetyPolicy"/> rather than by the model.
/// </summary>
public class MaintenanceAgent : IMaintenanceAgent
{
    private readonly IChatModel _model;
    private readonly IMaintenanceToolbox _toolbox;
    private readonly AppDbContext _context;
    private readonly MaintenanceAgentOptions _options;
    private readonly ILogger<MaintenanceAgent> _logger;

    public MaintenanceAgent(
        IChatModel model,
        IMaintenanceToolbox toolbox,
        AppDbContext context,
        IOptions<MaintenanceAgentOptions> options,
        ILogger<MaintenanceAgent> logger)
    {
        _model = model;
        _toolbox = toolbox;
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<MaintenanceTriageResultDto> TriageAsync(
        Guid userId,
        MaintenanceTriageRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // Authorise before spending anything on the model.
        var lease = await MaintenanceAccess.FindCurrentLeaseAsync(_context, userId, request.PropertyId, cancellationToken)
            ?? throw new MaintenanceAuthorizationException(
                "You do not have a current lease on that property, so you cannot report maintenance for it.");

        var turns = BuildOpeningTurns(request);
        var trace = new List<AgentToolCallDto>();

        await RunToolPhaseAsync(userId, turns, trace, cancellationToken);

        var (assessment, answeringModel) = await RunStructuredPhaseAsync(turns, cancellationToken);

        var result = MapAssessment(assessment, trace);

        // The model's opinion on urgency is advisory. Escalation and the safety steps shown
        // to the tenant come from deterministic policy, so a model that under-rates a gas
        // leak cannot suppress the warning.
        result.RequiresUrgentEscalation = MaintenanceSafetyPolicy.RequiresUrgentEscalation(result.Category, result.Urgency);
        result.EscalationReason = MaintenanceSafetyPolicy.EscalationReason(result.Category, result.Urgency);
        result.SafetyAdvice = MaintenanceSafetyPolicy.SafetyAdvice(result.Category, result.Urgency).ToList();

        result.PossibleDuplicates = await FindPossibleDuplicatesAsync(
            lease.TenantId, request.PropertyId, result.Category, cancellationToken);

        // Issued here and replayed on approval, so an accidental double-submit of the same
        // approved draft cannot create two requests.
        result.IdempotencyKey = Guid.NewGuid();

        // The model that actually produced the assessment, which may be a fallback rather
        // than the configured primary. Recorded so the audit trail is truthful.
        result.Model = answeringModel;

        _logger.LogInformation(
            "Triaged property {PropertyId} for user {UserId}: {Category}/{Urgency}, escalated={Escalated}, tools={ToolCalls}.",
            request.PropertyId, userId, result.Category, result.Urgency, result.RequiresUrgentEscalation, trace.Count);

        return result;
    }

    // --- Phase A: let the model use tools ---

    private async Task RunToolPhaseAsync(
        Guid userId,
        List<ChatTurn> turns,
        List<AgentToolCallDto> trace,
        CancellationToken cancellationToken)
    {
        var totalToolCalls = 0;

        for (var iteration = 0; iteration < _options.MaxToolIterations; iteration++)
        {
            ChatModelResponse response;

            try
            {
                response = await _model.CompleteAsync(
                    new ChatRequest(SystemInstruction, turns, _toolbox.Definitions),
                    cancellationToken);
            }
            catch (ChatModelException ex)
            {
                throw new AgentAssessmentException($"The assistant could not be reached. {ex.Message}", ex);
            }

            if (!response.HasToolCalls)
            {
                if (!string.IsNullOrWhiteSpace(response.Text))
                    turns.Add(response.ModelTurn);

                return;
            }

            // Append the model's turn exactly as the client received it, rather than
            // rebuilding it: reasoning models attach state to their own turns that has to
            // be replayed unchanged for the next call to make sense of the tool results.
            turns.Add(response.ModelTurn);

            var results = new List<ToolResult>();

            foreach (var call in response.ToolCalls)
            {
                if (totalToolCalls >= _options.MaxTotalToolCalls)
                {
                    _logger.LogWarning(
                        "Tool call budget of {Budget} exhausted while triaging for user {UserId}.",
                        _options.MaxTotalToolCalls, userId);

                    results.Add(new ToolResult(
                        call.Name,
                        """{"error":"budget_exhausted","message":"No more lookups are available. Conclude with what you have."}""",
                        Succeeded: false));
                    continue;
                }

                totalToolCalls++;

                var result = await _toolbox.ExecuteAsync(userId, call, cancellationToken);
                results.Add(result);

                trace.Add(new AgentToolCallDto
                {
                    Name = result.Name,
                    Arguments = call.ArgumentsJson,
                    Result = result.ResultJson,
                    DurationMs = result.DurationMs,
                    Succeeded = result.Succeeded,
                    Error = result.Error
                });
            }

            turns.Add(ChatTurn.FromToolResults(results));
        }

        _logger.LogInformation(
            "Tool phase hit the {Max}-iteration cap; forcing the agent to conclude.",
            _options.MaxToolIterations);
    }

    // --- Phase B: force a schema-valid answer ---

    /// <returns>The validated assessment, and the model id that produced it.</returns>
    private async Task<(TriageAssessment Assessment, string ModelId)> RunStructuredPhaseAsync(
        List<ChatTurn> turns,
        CancellationToken cancellationToken)
    {
        turns.Add(ChatTurn.FromUser(FinalAnswerInstruction));

        var attempts = _options.RetryOnInvalidJson ? 2 : 1;
        string? lastError = null;

        for (var attempt = 1; attempt <= attempts; attempt++)
        {
            ChatModelResponse response;

            try
            {
                response = await _model.CompleteAsync(
                    new ChatRequest(
                        SystemInstruction,
                        turns,
                        Tools: null,
                        ResponseJsonSchema: ResponseSchema,
                        Temperature: 0.1),
                    cancellationToken);
            }
            catch (ChatModelException ex)
            {
                throw new AgentAssessmentException($"The assistant could not be reached. {ex.Message}", ex);
            }

            if (string.IsNullOrWhiteSpace(response.Text))
            {
                lastError = "The assistant returned an empty response.";
            }
            else if (TryParseAssessment(response.Text, out var assessment, out var validationError))
            {
                return (assessment!, response.ModelId);
            }
            else
            {
                lastError = validationError;
            }

            _logger.LogWarning(
                "Structured triage output was unusable on attempt {Attempt}/{Attempts}: {Error}",
                attempt, attempts, lastError);

            if (attempt < attempts)
            {
                // Tell the model precisely what was wrong and let it correct itself once.
                turns.Add(ChatTurn.FromUser(
                    $"That response could not be used: {lastError} " +
                    "Return only JSON matching the schema, with every required field filled in."));
            }
        }

        throw new AgentAssessmentException(
            $"The assistant could not produce a valid assessment. {lastError}");
    }

    private static bool TryParseAssessment(string text, out TriageAssessment? assessment, out string? error)
    {
        assessment = null;
        error = null;

        JsonNode? node;
        try
        {
            node = JsonNode.Parse(text);
        }
        catch (JsonException ex)
        {
            error = $"the response was not valid JSON ({ex.Message}).";
            return false;
        }

        if (node is not JsonObject root)
        {
            error = "the response was not a JSON object.";
            return false;
        }

        var categoryText = root["category"]?.GetValue<string>();
        if (!System.Enum.TryParse<MaintenanceCategory>(categoryText, ignoreCase: true, out var category))
        {
            error = $"'{categoryText}' is not a valid category.";
            return false;
        }

        var urgencyText = root["urgency"]?.GetValue<string>();
        if (!System.Enum.TryParse<MaintenanceUrgency>(urgencyText, ignoreCase: true, out var urgency)
            || urgency == MaintenanceUrgency.Unknown)
        {
            error = $"'{urgencyText}' is not a valid urgency.";
            return false;
        }

        var title = root["proposedTitle"]?.GetValue<string>();
        if (string.IsNullOrWhiteSpace(title))
        {
            error = "proposedTitle was missing or empty.";
            return false;
        }

        var summary = root["summary"]?.GetValue<string>();
        if (string.IsNullOrWhiteSpace(summary))
        {
            error = "summary was missing or empty.";
            return false;
        }

        var needsMoreInfo = root["needsMoreInfo"]?.GetValue<bool?>() ?? false;

        var questions = (root["followUpQuestions"] as JsonArray ?? new JsonArray())
            .Select(q => q?.GetValue<string>())
            .Where(q => !string.IsNullOrWhiteSpace(q))
            .Select(q => q!.Trim())
            .Take(3)
            .ToList();

        // A request for more information with nothing to ask is not actionable for the
        // tenant, so treat the assessment as complete instead.
        if (needsMoreInfo && questions.Count == 0)
            needsMoreInfo = false;

        var confidence = root["confidence"]?.GetValue<double?>() ?? 0d;

        assessment = new TriageAssessment(
            NeedsMoreInfo: needsMoreInfo,
            FollowUpQuestions: questions,
            ProposedTitle: Clip(title!.Trim(), 200),
            Category: category,
            Urgency: urgency,
            Summary: Clip(summary!.Trim(), 1000),
            Reasoning: Clip((root["reasoning"]?.GetValue<string>() ?? string.Empty).Trim(), 2000),
            Confidence: Math.Clamp(confidence, 0d, 1d),
            ProposedLandlordMessage: Clip((root["proposedLandlordMessage"]?.GetValue<string>() ?? string.Empty).Trim(), 2000));

        return true;
    }

    private static MaintenanceTriageResultDto MapAssessment(TriageAssessment a, List<AgentToolCallDto> trace) => new()
    {
        NeedsMoreInfo = a.NeedsMoreInfo,
        FollowUpQuestions = a.FollowUpQuestions,
        ProposedTitle = a.ProposedTitle,
        Category = a.Category,
        CategoryName = a.Category.ToString(),
        Urgency = a.Urgency,
        UrgencyName = a.Urgency.ToString(),
        Summary = a.Summary,
        Reasoning = a.Reasoning,
        Confidence = a.Confidence,
        ProposedLandlordMessage = a.ProposedLandlordMessage,
        ToolCalls = trace
    };

    /// <summary>
    /// Deterministic duplicate check, run independently of whatever the model concluded:
    /// open requests on the same property in the same category within the lookback window.
    /// </summary>
    private async Task<List<MaintenanceRequestSummaryDto>> FindPossibleDuplicatesAsync(
        Guid tenantId,
        int propertyId,
        MaintenanceCategory category,
        CancellationToken cancellationToken)
    {
        var since = DateTime.UtcNow.AddDays(-_options.DuplicateLookbackDays);

        var rows = await _context.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId
                        && r.PropertyId == propertyId
                        && r.Category == category
                        && r.CreatedAtUtc >= since
                        && MaintenanceRequest.OpenStatuses.Contains(r.Status))
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(5)
            .ToListAsync(cancellationToken);

        return rows.Select(MaintenanceMapping.ToSummary).ToList();
    }

    private static List<ChatTurn> BuildOpeningTurns(MaintenanceTriageRequestDto request)
    {
        var turns = new List<ChatTurn>
        {
            // The property id is stated as context rather than left for the model to guess,
            // but the tools still re-check that this tenant may read it.
            ChatTurn.FromUser(
                $"I am reporting a maintenance issue at property id {request.PropertyId}.")
        };

        foreach (var message in request.Messages)
        {
            if (string.IsNullOrWhiteSpace(message.Content))
                continue;

            var isAgent = string.Equals(message.Role, "agent", StringComparison.OrdinalIgnoreCase);

            turns.Add(isAgent
                ? ChatTurn.FromModel(message.Content.Trim())
                : ChatTurn.FromUser(message.Content.Trim()));
        }

        return turns;
    }

    private static string Clip(string value, int max) =>
        value.Length <= max ? value : value[..max];

    /// <summary>Validated shape of the model's structured answer.</summary>
    private sealed record TriageAssessment(
        bool NeedsMoreInfo,
        List<string> FollowUpQuestions,
        string ProposedTitle,
        MaintenanceCategory Category,
        MaintenanceUrgency Urgency,
        string Summary,
        string Reasoning,
        double Confidence,
        string ProposedLandlordMessage);

    private const string SystemInstruction = """
        You are the RentalWise maintenance assistant. You help a tenant report a maintenance
        issue at a property they rent in New Zealand, and you prepare a draft request for
        their landlord.

        How to work:
        - Use the tools before you assess. Call get_property_details for the property in
          question, and get_maintenance_history to check whether this has been reported
          already or whether a related problem is still open.
        - If a tool refuses or fails, carry on and say in your reasoning what you could not
          check. Do not guess the information it would have given you.
        - Ask a clarifying question only when you genuinely cannot classify the issue without
          it, and ask at most two short questions at a time.
        - Classify conservatively. If an issue sits between two urgency levels, choose the
          higher one.
        - Base everything on what the tenant told you and what the tools returned. Do not
          invent details about the property, its appliances, or past repairs.

        Hard limits:
        - You never contact tradespeople, suppliers or emergency services, and you never
          state or imply that anyone has been contacted, booked or dispatched.
        - You never promise a timeframe or a cost, say who will pay, or say that a repair has
          been approved.
        - You do not give legal advice about the tenancy.
        - You do not decide the safety escalation. The application applies its own safety
          rules after you respond, and those rules override your view.
        - Everything you produce is a draft. Nothing is saved until the tenant approves it.

        Categories: Plumbing, Flooding, Electrical, GasOrFumes, HeatingCooling, Appliance,
        StructuralOrRoof, PestControl, LocksAndSecurity, SmokeAlarm, Grounds, Other.

        Urgency levels:
        - Low: cosmetic or minor; can wait for a routine visit.
        - Medium: inconvenient, but the property is still perfectly liveable.
        - High: affects how liveable the property is, or will get noticeably worse if left.
        - Emergency: immediate risk to someone's safety, or serious damage happening right now.

        The landlord message you draft should be short, factual and polite, written in the
        tenant's voice, and must contain no promises or demands.
        """;

    private const string FinalAnswerInstruction = """
        Now give your assessment as JSON matching the required schema. Do not call any more
        tools.

        If you still need something from the tenant, set needsMoreInfo to true and put your
        questions in followUpQuestions - but still fill in your best current assessment of
        every other field, so the tenant can see where you have got to.
        """;

    /// <summary>
    /// Gemini response schema. Deliberately restricted to the OpenAPI subset Gemini
    /// supports: object/array/string/boolean/number, enum, properties, required and
    /// description. Numeric bounds are not expressed here - confidence is clamped in code.
    /// </summary>
    private const string ResponseSchema = """
        {
          "type": "object",
          "properties": {
            "needsMoreInfo": {
              "type": "boolean",
              "description": "True only if you cannot assess the issue without more detail from the tenant."
            },
            "followUpQuestions": {
              "type": "array",
              "description": "Up to two short questions for the tenant. Empty when the assessment is complete.",
              "items": { "type": "string" }
            },
            "proposedTitle": {
              "type": "string",
              "description": "Short title for the request, under 80 characters."
            },
            "category": {
              "type": "string",
              "enum": ["Plumbing","Flooding","Electrical","GasOrFumes","HeatingCooling","Appliance","StructuralOrRoof","PestControl","LocksAndSecurity","SmokeAlarm","Grounds","Other"]
            },
            "urgency": {
              "type": "string",
              "enum": ["Low","Medium","High","Emergency"]
            },
            "summary": {
              "type": "string",
              "description": "One or two sentences restating the problem plainly."
            },
            "reasoning": {
              "type": "string",
              "description": "Why you chose this category and urgency, including what the tools told you and anything you could not check."
            },
            "confidence": {
              "type": "number",
              "description": "Your confidence in the classification, between 0 and 1."
            },
            "proposedLandlordMessage": {
              "type": "string",
              "description": "Draft message to the landlord, in the tenant's voice."
            }
          },
          "required": ["needsMoreInfo","proposedTitle","category","urgency","summary","reasoning","confidence","proposedLandlordMessage"]
        }
        """;
}
