namespace RentalWise.Infrastructure.Ai.Gemini;

/// <summary>
/// Configuration for the Gemini chat model, bound from the "Gemini" configuration section.
///
/// The API key is deliberately not given a default. Supply it out of band:
///   dotnet user-secrets set "Gemini:ApiKey" "..." --project RentalWise.API
/// or via the GEMINI_API_KEY environment variable.
/// </summary>
public sealed class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Model id. Flash is the right default here: triage is a short, high-volume,
    /// latency-sensitive classification task rather than long-form generation.
    ///
    /// Two things to know when changing this. gemini-2.5-flash is no longer served to new
    /// API keys (it 404s, pointing at the 3.x line), and the newest model is not always the
    /// most available - gemini-3.8-flash was returning 503s and timeouts when this was
    /// chosen, while 3.7 answered reliably. Prefer a model you have actually exercised with
    /// a tool-calling request over whichever is newest.
    /// </summary>
    public string Model { get; set; } = "gemini-3.7-flash";

    /// <summary>Base URL. Must end with a slash so relative paths resolve correctly.</summary>
    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/";

    /// <summary>
    /// Models to fall back to, in order, when the primary is unavailable.
    ///
    /// Capacity on a given Gemini model genuinely fluctuates - both 3.8 and 3.7 returned
    /// 503 "experiencing high demand" within minutes of each other while this was being
    /// built. Falling back costs nothing when the primary is healthy and is the difference
    /// between a working demo and an error message when it is not. Also covers a model
    /// being retired underneath us, since that shows up as a 404.
    /// </summary>
    public List<string> FallbackModels { get; set; } = new()
    {
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3-flash-preview"
    };

    public int TimeoutSeconds { get; set; } = 45;

    /// <summary>
    /// Extra attempts after the first, per model, for throttling and 5xx responses only.
    /// </summary>
    public int MaxRetries { get; set; } = 2;
}
