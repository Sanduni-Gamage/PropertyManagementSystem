using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RentalWise.Domain.Ai;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.Application.Services.Maintenance;

/// <summary>
/// The tools the maintenance agent may call.
///
/// Two rules hold for every tool here:
///
/// 1. Authorisation is re-checked inside the tool, against the caller's user id, using the
///    arguments the model supplied. The model is treated as untrusted input: if it asks
///    about a property the tenant does not lease, the tool refuses. The endpoint checks the
///    same thing first, so this is defence in depth rather than the only gate.
///
/// 2. Failures are returned as JSON, not thrown. A refused or failed tool should let the
///    agent explain itself, not abort the run with a 500.
/// </summary>
public interface IMaintenanceToolbox
{
    /// <summary>Declarations advertised to the model.</summary>
    IReadOnlyList<ToolDefinition> Definitions { get; }

    /// <summary>Runs one model-requested tool call on behalf of <paramref name="userId"/>.</summary>
    Task<ToolResult> ExecuteAsync(Guid userId, ToolCall call, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IMaintenanceToolbox"/>
public class MaintenanceToolbox : IMaintenanceToolbox
{
    public const string GetPropertyDetails = "get_property_details";
    public const string GetMaintenanceHistory = "get_maintenance_history";

    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly AppDbContext _context;
    private readonly MaintenanceAgentOptions _options;
    private readonly ILogger<MaintenanceToolbox> _logger;

    public MaintenanceToolbox(
        AppDbContext context,
        IOptions<MaintenanceAgentOptions> options,
        ILogger<MaintenanceToolbox> logger)
    {
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public IReadOnlyList<ToolDefinition> Definitions { get; } = new[]
    {
        new ToolDefinition(
            GetPropertyDetails,
            "Look up the details of a property the tenant leases: address, suburb, type, " +
            "bedrooms, bathrooms, heating, smoke alarms, and the tenant's lease dates. " +
            "Call this before assessing an issue so the assessment reflects the actual property.",
            """
            {
              "type": "object",
              "properties": {
                "propertyId": {
                  "type": "integer",
                  "description": "Id of the property the issue was reported against."
                }
              },
              "required": ["propertyId"]
            }
            """),

        new ToolDefinition(
            GetMaintenanceHistory,
            "List maintenance requests this tenant has already raised for a property. " +
            "Use it to check whether the issue has been reported before, and to see whether " +
            "a related problem is still open. Returns the tenant's own requests only.",
            """
            {
              "type": "object",
              "properties": {
                "propertyId": {
                  "type": "integer",
                  "description": "Id of the property to list requests for."
                },
                "onlyOpen": {
                  "type": "boolean",
                  "description": "When true, return only requests that are not resolved or cancelled. Defaults to false."
                },
                "category": {
                  "type": "string",
                  "description": "Optional category filter, for example Plumbing or Electrical.",
                  "enum": ["Plumbing","Flooding","Electrical","GasOrFumes","HeatingCooling","Appliance","StructuralOrRoof","PestControl","LocksAndSecurity","SmokeAlarm","Grounds","Other"]
                }
              },
              "required": ["propertyId"]
            }
            """)
    };

    public async Task<ToolResult> ExecuteAsync(Guid userId, ToolCall call, CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var args = ParseArguments(call.ArgumentsJson);

            var json = call.Name switch
            {
                GetPropertyDetails => await RunGetPropertyDetailsAsync(userId, args, cancellationToken),
                GetMaintenanceHistory => await RunGetMaintenanceHistoryAsync(userId, args, cancellationToken),
                _ => Error("unknown_tool", $"There is no tool called '{call.Name}'.")
            };

            stopwatch.Stop();

            var succeeded = JsonNode.Parse(json)?["error"] is null;

            return new ToolResult(call.Name, json, succeeded, stopwatch.ElapsedMilliseconds);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            // Log the detail for operators; hand the model something generic so provider
            // internals and stack traces never travel into a prompt.
            _logger.LogError(ex, "Maintenance tool {Tool} failed for user {UserId}.", call.Name, userId);

            return new ToolResult(
                call.Name,
                Error("tool_failed", "This lookup could not be completed. Continue without it and say so."),
                Succeeded: false,
                stopwatch.ElapsedMilliseconds,
                ex.Message);
        }
    }

    private async Task<string> RunGetPropertyDetailsAsync(Guid userId, JsonObject args, CancellationToken cancellationToken)
    {
        if (!TryGetInt(args, "propertyId", out var propertyId))
            return Error("invalid_arguments", "propertyId is required and must be an integer.");

        var lease = await FindCurrentLeaseAsync(userId, propertyId, cancellationToken);
        if (lease is null)
            return Error("not_authorised", "This tenant does not have a current lease on that property.");

        // IgnoreQueryFilters deliberately: Properties are soft-deleted via an IsActive
        // filter, and a tenant living in a delisted property must still be able to get
        // its details in order to report a fault.
        var property = await _context.Properties
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(p => p.Suburb)
                .ThenInclude(s => s.District)
                    .ThenInclude(d => d.Region)
            .FirstOrDefaultAsync(p => p.Id == propertyId, cancellationToken);

        if (property is null)
            return Error("not_found", "That property no longer exists.");

        var payload = new
        {
            propertyId = property.Id,
            name = property.Name,
            address = property.Address,
            suburb = property.Suburb?.Name,
            district = property.Suburb?.District?.Name,
            region = property.Suburb?.District?.Region?.Name,
            propertyType = property.PropertyType.ToString(),
            bedrooms = property.Bedrooms,
            bathrooms = property.Bathrooms,
            parkingSpaces = property.ParkingSpaces,
            features = property.Features.ToString(),
            furnishings = property.Furnishings,
            broadband = property.Broadband.ToString(),
            smokeAlarmInstalled = property.SmokeAlarm,
            petsAllowed = property.PetsAllowed,
            maximumTenants = property.MaximumTenants,
            yourLease = new
            {
                startDate = lease.StartDate.ToString("yyyy-MM-dd"),
                endDate = lease.EndDate.ToString("yyyy-MM-dd")
            }
        };

        return JsonSerializer.Serialize(payload, Json);
    }

    private async Task<string> RunGetMaintenanceHistoryAsync(Guid userId, JsonObject args, CancellationToken cancellationToken)
    {
        if (!TryGetInt(args, "propertyId", out var propertyId))
            return Error("invalid_arguments", "propertyId is required and must be an integer.");

        var lease = await FindCurrentLeaseAsync(userId, propertyId, cancellationToken);
        if (lease is null)
            return Error("not_authorised", "This tenant does not have a current lease on that property.");

        var onlyOpen = args["onlyOpen"]?.GetValue<bool?>() ?? false;
        var categoryFilter = args["category"]?.GetValue<string>();

        var since = DateTime.UtcNow.AddDays(-_options.DuplicateLookbackDays);

        // Scoped to this tenant's own requests. Other tenants' history for the same
        // property is intentionally not exposed here.
        var query = _context.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.TenantId == lease.TenantId && r.PropertyId == propertyId);

        if (onlyOpen)
            query = query.Where(r => MaintenanceRequest.OpenStatuses.Contains(r.Status));
        else
            query = query.Where(r => r.CreatedAtUtc >= since || MaintenanceRequest.OpenStatuses.Contains(r.Status));

        if (!string.IsNullOrWhiteSpace(categoryFilter)
            && System.Enum.TryParse<Domain.Enum.MaintenanceCategory>(categoryFilter, ignoreCase: true, out var parsedCategory))
        {
            query = query.Where(r => r.Category == parsedCategory);
        }

        var rows = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(20)
            .Select(r => new
            {
                id = r.Id,
                title = r.Title,
                category = r.Category.ToString(),
                urgency = r.Urgency.ToString(),
                status = r.Status.ToString(),
                isOpen = MaintenanceRequest.OpenStatuses.Contains(r.Status),
                requiresUrgentEscalation = r.RequiresUrgentEscalation,
                reportedOn = r.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        var payload = new
        {
            propertyId,
            lookbackDays = _options.DuplicateLookbackDays,
            count = rows.Count,
            requests = rows.Select(r => new
            {
                r.id,
                r.title,
                r.category,
                r.urgency,
                r.status,
                r.isOpen,
                r.requiresUrgentEscalation,
                reportedOn = r.reportedOn.ToString("yyyy-MM-dd")
            })
        };

        return JsonSerializer.Serialize(payload, Json);
    }

    private Task<Lease?> FindCurrentLeaseAsync(Guid userId, int propertyId, CancellationToken cancellationToken) =>
        MaintenanceAccess.FindCurrentLeaseAsync(_context, userId, propertyId, cancellationToken);

    private static JsonObject ParseArguments(string? argumentsJson)
    {
        if (string.IsNullOrWhiteSpace(argumentsJson))
            return new JsonObject();

        try
        {
            return JsonNode.Parse(argumentsJson) as JsonObject ?? new JsonObject();
        }
        catch (JsonException)
        {
            return new JsonObject();
        }
    }

    /// <summary>
    /// Reads an integer argument tolerantly: models sometimes send numbers as strings.
    /// </summary>
    private static bool TryGetInt(JsonObject args, string name, out int value)
    {
        value = 0;
        var node = args[name];
        if (node is null) return false;

        try
        {
            value = node.GetValue<int>();
            return true;
        }
        catch (Exception)
        {
            return int.TryParse(node.ToString(), out value);
        }
    }

    private static string Error(string code, string message) =>
        JsonSerializer.Serialize(new { error = code, message }, Json);
}
