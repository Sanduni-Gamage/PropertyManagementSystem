namespace RentalWise.Domain.Ai;

/// <summary>
/// Who produced a turn in the conversation sent to the model.
/// </summary>
public enum ChatRole
{
    /// <summary>The application or end user speaking to the model.</summary>
    User = 0,

    /// <summary>The model's own previous output, replayed so it sees its own history.</summary>
    Model = 1
}

/// <summary>
/// One turn of conversation. A turn carries either free text, a set of tool calls the model
/// asked for, or the results of tool calls the application ran - never a mixture that
/// providers disallow.
/// </summary>
/// <param name="Role">Who produced this turn.</param>
/// <param name="Text">Plain text content, if any.</param>
/// <param name="ToolCalls">Tool calls requested by the model in this turn.</param>
/// <param name="ToolResults">Results the application is returning for earlier tool calls.</param>
/// <param name="ProviderState">
/// Opaque provider payload for this turn, to be replayed verbatim instead of being rebuilt
/// from the fields above.
///
/// This exists because reasoning models attach data to their own turns that the caller must
/// hand back unchanged - Gemini 3's thought signatures, for instance, which tie a function
/// call to the reasoning that produced it. Reconstructing the turn from Text and ToolCalls
/// would silently drop them and break multi-step tool use. Set by the client, never by the
/// agent, and meaningless outside the provider that produced it.
/// </param>
public sealed record ChatTurn(
    ChatRole Role,
    string? Text = null,
    IReadOnlyList<ToolCall>? ToolCalls = null,
    IReadOnlyList<ToolResult>? ToolResults = null,
    string? ProviderState = null)
{
    public static ChatTurn FromUser(string text) => new(ChatRole.User, text);

    public static ChatTurn FromModel(string text) => new(ChatRole.Model, text);

    public static ChatTurn FromModelToolCalls(IReadOnlyList<ToolCall> calls) =>
        new(ChatRole.Model, null, calls);

    public static ChatTurn FromToolResults(IReadOnlyList<ToolResult> results) =>
        new(ChatRole.User, null, null, results);
}

/// <summary>
/// A declared capability the model may invoke.
/// </summary>
/// <param name="Name">Stable snake_case identifier the model uses to call it.</param>
/// <param name="Description">What it does and when to use it, written for the model.</param>
/// <param name="ParametersJsonSchema">JSON Schema (OpenAPI subset) describing the arguments.</param>
public sealed record ToolDefinition(
    string Name,
    string Description,
    string ParametersJsonSchema);

/// <summary>A tool invocation requested by the model.</summary>
/// <param name="Name">Tool name the model asked for; may not exist.</param>
/// <param name="ArgumentsJson">Raw JSON object of arguments, unvalidated.</param>
public sealed record ToolCall(string Name, string ArgumentsJson);

/// <summary>
/// The outcome of running a tool, returned to the model. Failures are returned as data
/// rather than thrown, so the model can recover or explain instead of the run dying.
/// </summary>
/// <param name="Name">Tool that ran.</param>
/// <param name="ResultJson">JSON object the model will read.</param>
/// <param name="Succeeded">False when the tool refused or errored.</param>
/// <param name="DurationMs">Wall-clock time taken, for the audit trace.</param>
/// <param name="Error">Operator-facing error detail; never shown to the model verbatim.</param>
public sealed record ToolResult(
    string Name,
    string ResultJson,
    bool Succeeded = true,
    long DurationMs = 0,
    string? Error = null);

/// <summary>
/// A request to the chat model.
/// </summary>
/// <param name="SystemInstruction">Standing instructions, sent separately from the turns.</param>
/// <param name="Turns">Conversation so far, oldest first.</param>
/// <param name="Tools">
/// Tools the model may call. When any are supplied, <paramref name="ResponseJsonSchema"/>
/// is ignored, so a caller that wants both gathers context first and then asks for the
/// structured answer in a second, tool-free call. Gemini 2.5 rejected the combination
/// outright; 3.x accepts it, but keeping the two apart means the final answer is always
/// schema-valid however many tool rounds preceded it.
/// </param>
/// <param name="ResponseJsonSchema">
/// When set and no tools are supplied, the model is constrained to return JSON matching
/// this schema.
/// </param>
/// <param name="Temperature">Sampling temperature; low for classification work.</param>
/// <param name="MaxOutputTokens">Upper bound on response length.</param>
public sealed record ChatRequest(
    string SystemInstruction,
    IReadOnlyList<ChatTurn> Turns,
    IReadOnlyList<ToolDefinition>? Tools = null,
    string? ResponseJsonSchema = null,
    double Temperature = 0.2,
    int MaxOutputTokens = 2048);

/// <summary>
/// What the model returned: either text, or tool calls it wants run, or both.
/// </summary>
public sealed record ChatModelResponse(
    string? Text,
    IReadOnlyList<ToolCall> ToolCalls,
    string ModelId,
    int? PromptTokens = null,
    int? ResponseTokens = null,
    string? FinishReason = null)
{
    public bool HasToolCalls => ToolCalls.Count > 0;

    /// <summary>
    /// The model's own turn, ready to append to the conversation before sending tool
    /// results back. Always use this rather than rebuilding a turn from
    /// <see cref="Text"/> or <see cref="ToolCalls"/>: it carries the provider state that
    /// reasoning models require to be replayed unchanged.
    /// </summary>
    public ChatTurn ModelTurn { get; init; } = new(ChatRole.Model);
}

/// <summary>
/// A provider-agnostic chat model with tool-calling and structured-output support.
/// Implemented by <c>GeminiChatModel</c>; the agent depends only on this.
/// </summary>
public interface IChatModel
{
    /// <summary>Identifier of the underlying model, recorded on each triage for audit.</summary>
    string ModelId { get; }

    Task<ChatModelResponse> CompleteAsync(ChatRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// Raised when the model provider cannot be reached or returns an unusable response.
/// Messages are safe to log: they never contain credentials.
/// </summary>
public class ChatModelException : Exception
{
    public ChatModelException(string message, Exception? inner = null) : base(message, inner) { }

    /// <summary>HTTP status returned by the provider, when the failure was an HTTP error.</summary>
    public int? StatusCode { get; init; }

    /// <summary>True for conditions worth retrying, such as throttling or a timeout.</summary>
    public bool IsTransient { get; init; }
}
