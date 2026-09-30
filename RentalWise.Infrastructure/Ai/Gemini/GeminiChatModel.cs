using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RentalWise.Domain.Ai;

namespace RentalWise.Infrastructure.Ai.Gemini;


/// <see cref="IChatModel"/> over the Gemini generateContent REST API.
///
/// Hand-rolled against the REST surface rather than an SDK, for three reasons: the request
/// shape we need is small, it keeps the dependency surface of a portfolio project honest,
/// and it lets tool schemas be passed through as raw JSON without fighting a wrapper.
///
/// The API key travels in the <c>x-goog-api-key</c> header rather than the query string so
/// it cannot end up in request logs or exception messages.

public sealed class GeminiChatModel : IChatModel
{
    private readonly HttpClient _http;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiChatModel> _logger;

    public GeminiChatModel(HttpClient http, IOptions<GeminiOptions> options, ILogger<GeminiChatModel> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public string ModelId => _options.Model;

    public async Task<ChatModelResponse> CompleteAsync(ChatRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new ChatModelException(
                "Gemini API key is not configured. Set it with " +
                "'dotnet user-secrets set \"Gemini:ApiKey\" \"<key>\" --project RentalWise.API' " +
                "or the GEMINI_API_KEY environment variable.");
        }

        var payload = BuildRequestBody(request).ToJsonString();

        ChatModelException? lastFailure = null;

        foreach (var model in ModelsToTry())
        {
            try
            {
                return await SendWithRetriesAsync(model, payload, cancellationToken);
            }
            catch (ChatModelException ex) when (ex.IsTransient || ex.StatusCode == 404)
            {
                // Either the model is saturated or it has been retired. Both are reasons to
                // try the next one rather than fail the caller.
                lastFailure = ex;
                _logger.LogWarning(
                    "Gemini model {Model} unavailable (status {Status}). Falling back to the next configured model.",
                    model, ex.StatusCode);
            }
        }

        throw lastFailure ?? new ChatModelException("Gemini call failed for an unknown reason.");
    }

    /// <summary>The primary model, then each distinct fallback in order.</summary>
    private IEnumerable<string> ModelsToTry()
    {
        yield return _options.Model;

        foreach (var fallback in _options.FallbackModels ?? new List<string>())
        {
            if (!string.IsNullOrWhiteSpace(fallback)
                && !string.Equals(fallback, _options.Model, StringComparison.OrdinalIgnoreCase))
            {
                yield return fallback;
            }
        }
    }

    private async Task<ChatModelResponse> SendWithRetriesAsync(
        string model,
        string payload,
        CancellationToken cancellationToken)
    {
        var attempts = Math.Max(1, _options.MaxRetries + 1);
        ChatModelException? lastFailure = null;

        for (var attempt = 1; attempt <= attempts; attempt++)
        {
            try
            {
                return await SendOnceAsync(model, payload, attempt, cancellationToken);
            }
            catch (ChatModelException ex) when (ex.IsTransient && attempt < attempts)
            {
                lastFailure = ex;
                var delay = TimeSpan.FromMilliseconds(400 * Math.Pow(2, attempt - 1));
                _logger.LogWarning(
                    "Gemini {Model} failed transiently (attempt {Attempt}/{Attempts}, status {Status}). Retrying in {Delay}ms.",
                    model, attempt, attempts, ex.StatusCode, delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
        }

        throw lastFailure ?? new ChatModelException($"Gemini call to {model} failed for an unknown reason.");
    }

    private async Task<ChatModelResponse> SendOnceAsync(
        string model,
        string payload,
        int attempt,
        CancellationToken cancellationToken)
    {
        var path = $"models/{model}:generateContent";

        using var message = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        message.Headers.Add("x-goog-api-key", _options.ApiKey);

        var stopwatch = Stopwatch.StartNew();
        HttpResponseMessage response;

        try
        {
            response = await _http.SendAsync(message, cancellationToken);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            // HttpClient surfaces its own timeout as a cancellation.
            throw new ChatModelException($"Gemini request timed out after {_options.TimeoutSeconds}s.", ex)
            {
                IsTransient = true
            };
        }
        catch (HttpRequestException ex)
        {
            throw new ChatModelException($"Could not reach Gemini: {ex.Message}", ex) { IsTransient = true };
        }

        using (response)
        {
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);
            stopwatch.Stop();

            if (!response.IsSuccessStatusCode)
                throw MapErrorResponse(response.StatusCode, raw);

            _logger.LogInformation(
                "Gemini {Model} responded {Status} in {Elapsed}ms (attempt {Attempt}).",
                model, (int)response.StatusCode, stopwatch.ElapsedMilliseconds, attempt);

            return ParseResponse(raw, model);
        }
    }

    private ChatModelException MapErrorResponse(HttpStatusCode status, string body)
    {
        // Surface enough of the provider's message to debug, but cap it so a large error
        // body cannot flood the logs.
        var detail = Truncate(ExtractErrorMessage(body) ?? body, 400);

        var transient = status is HttpStatusCode.TooManyRequests
            or HttpStatusCode.InternalServerError
            or HttpStatusCode.BadGateway
            or HttpStatusCode.ServiceUnavailable
            or HttpStatusCode.GatewayTimeout;

        var friendly = status switch
        {
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden =>
                "Gemini rejected the API key. Check Gemini:ApiKey.",
            HttpStatusCode.TooManyRequests =>
                "Gemini rate limit reached.",
            HttpStatusCode.BadRequest =>
                $"Gemini rejected the request: {detail}",
            _ => $"Gemini returned {(int)status}: {detail}"
        };

        return new ChatModelException(friendly) { StatusCode = (int)status, IsTransient = transient };
    }

    private static string? ExtractErrorMessage(string body)
    {
        try
        {
            return JsonNode.Parse(body)?["error"]?["message"]?.GetValue<string>();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private ChatModelResponse ParseResponse(string raw, string model)
    {
        JsonNode? root;
        try
        {
            root = JsonNode.Parse(raw);
        }
        catch (JsonException ex)
        {
            throw new ChatModelException("Gemini returned a response that was not valid JSON.", ex);
        }

        // A prompt blocked by safety filters comes back with no candidates.
        var blockReason = root?["promptFeedback"]?["blockReason"]?.GetValue<string>();
        if (!string.IsNullOrEmpty(blockReason))
            throw new ChatModelException($"Gemini blocked the prompt ({blockReason}).");

        var candidate = root?["candidates"] is JsonArray { Count: > 0 } candidates
            ? candidates[0]
            : null;

        if (candidate is null)
            throw new ChatModelException("Gemini returned no candidates.");

        var finishReason = candidate["finishReason"]?.GetValue<string>();
        var text = new StringBuilder();
        var toolCalls = new List<ToolCall>();

        if (candidate["content"]?["parts"] is JsonArray parts)
        {
            foreach (var part in parts)
            {
                if (part is null) continue;

                var partText = part["text"]?.GetValue<string>();
                if (!string.IsNullOrEmpty(partText))
                    text.Append(partText);

                var call = part["functionCall"];
                if (call is not null)
                {
                    var name = call["name"]?.GetValue<string>();
                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        var args = call["args"]?.ToJsonString() ?? "{}";
                        toolCalls.Add(new ToolCall(name, args));
                    }
                }
            }
        }

        // MAX_TOKENS with nothing usable means the caller gets a truncated or empty answer;
        // better to fail loudly than to parse half a JSON object downstream.
        if (finishReason == "MAX_TOKENS" && toolCalls.Count == 0 && text.Length == 0)
            throw new ChatModelException("Gemini hit the output token limit before producing any content.");

        var usage = root?["usageMetadata"];

        // Keep the candidate's content exactly as it arrived so it can be replayed on the
        // next request. Gemini 3 attaches a thoughtSignature to its parts, which ties a
        // function call to the reasoning behind it and must be handed back unchanged;
        // rebuilding the turn from the parsed text and tool calls would drop it.
        //
        // This is not optional. Replaying a functionCall without its signature fails the
        // very next request - the one carrying the tool result - with:
        //
        //   400 - Function call is missing a thought_signature in functionCall parts.
        //         This is required for tools to work correctly, and missing
        //         thought_signature may lead to degraded model performance.
        //
        // So a tool-calling run could never complete at all, not merely degrade.
        // Verified by replaying an identical request with the field stripped: 200 vs 400.
        var rawContent = candidate["content"];
        if (rawContent is JsonObject contentObject && contentObject["role"] is null)
            contentObject["role"] = "model";

        return new ChatModelResponse(
            Text: text.Length > 0 ? text.ToString() : null,
            ToolCalls: toolCalls,
            // The model that actually answered, which may be a fallback.
            ModelId: model,
            PromptTokens: usage?["promptTokenCount"]?.GetValue<int>(),
            ResponseTokens: usage?["candidatesTokenCount"]?.GetValue<int>(),
            FinishReason: finishReason)
        {
            ModelTurn = new ChatTurn(
                ChatRole.Model,
                text.Length > 0 ? text.ToString() : null,
                toolCalls,
                null,
                rawContent?.ToJsonString())
        };
    }

    private static JsonObject BuildRequestBody(ChatRequest request)
    {
        var contents = new JsonArray();

        foreach (var turn in request.Turns)
        {
            // A turn the provider produced is replayed exactly as it arrived, so thought
            // signatures and any other provider-attached data survive the round trip.
            if (!string.IsNullOrWhiteSpace(turn.ProviderState))
            {
                var replay = SafeParse(turn.ProviderState);
                if (replay is JsonObject replayObject)
                {
                    contents.Add(replayObject);
                    continue;
                }
            }

            var parts = new JsonArray();

            if (!string.IsNullOrWhiteSpace(turn.Text))
                parts.Add(new JsonObject { ["text"] = turn.Text });

            if (turn.ToolCalls is { Count: > 0 })
            {
                foreach (var call in turn.ToolCalls)
                {
                    parts.Add(new JsonObject
                    {
                        ["functionCall"] = new JsonObject
                        {
                            ["name"] = call.Name,
                            ["args"] = ParseObjectOrEmpty(call.ArgumentsJson)
                        }
                    });
                }
            }

            if (turn.ToolResults is { Count: > 0 })
            {
                foreach (var result in turn.ToolResults)
                {
                    parts.Add(new JsonObject
                    {
                        ["functionResponse"] = new JsonObject
                        {
                            ["name"] = result.Name,
                            ["response"] = ParseObjectOrEmpty(result.ResultJson)
                        }
                    });
                }
            }

            if (parts.Count == 0)
                continue;

            contents.Add(new JsonObject
            {
                // The REST API accepts only "user" and "model"; function results are sent
                // back on a user turn.
                ["role"] = turn.Role == ChatRole.Model ? "model" : "user",
                ["parts"] = parts
            });
        }

        var generationConfig = new JsonObject
        {
            ["temperature"] = request.Temperature,
            ["maxOutputTokens"] = request.MaxOutputTokens
        };

        var body = new JsonObject
        {
            ["systemInstruction"] = new JsonObject
            {
                ["parts"] = new JsonArray { new JsonObject { ["text"] = request.SystemInstruction } }
            },
            ["contents"] = contents,
            ["generationConfig"] = generationConfig
        };

        if (request.Tools is { Count: > 0 })
        {
            var declarations = new JsonArray();

            foreach (var tool in request.Tools)
            {
                var declaration = new JsonObject
                {
                    ["name"] = tool.Name,
                    ["description"] = tool.Description
                };

                var schema = SafeParse(tool.ParametersJsonSchema);
                if (schema is not null)
                    declaration["parameters"] = schema;

                declarations.Add(declaration);
            }

            body["tools"] = new JsonArray { new JsonObject { ["functionDeclarations"] = declarations } };

            // Intentionally no responseSchema alongside tools. Gemini 2.5 rejected that
            // combination; 3.x accepts it, but the agent still asks for its structured
            // result in a separate tool-free call, so the schema is applied once the model
            // has finished gathering context rather than while it is still deciding.
        }
        else if (!string.IsNullOrWhiteSpace(request.ResponseJsonSchema))
        {
            var schema = SafeParse(request.ResponseJsonSchema);
            if (schema is not null)
            {
                generationConfig["responseMimeType"] = "application/json";
                generationConfig["responseSchema"] = schema;
            }
        }

        return body;
    }

    private static JsonNode ParseObjectOrEmpty(string? json)
    {
        var parsed = SafeParse(json);
        return parsed as JsonObject ?? new JsonObject();
    }

    private static JsonNode? SafeParse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonNode.Parse(json);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max] + "…";
}
