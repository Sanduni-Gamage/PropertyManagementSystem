using RentalWise.Application.DTOs.Maintenance;
using RentalWise.Domain.Entities;

namespace RentalWise.Application.Services.Maintenance;

/// <summary>
/// Entity-to-DTO mapping for maintenance.
///
/// Written by hand rather than through AutoMapper (which the rest of the project uses)
/// because every DTO here carries derived fields - readable enum names and the
/// "did the tenant disagree with the agent" flag - and expressing those as AutoMapper
/// projections is longer and harder to read than the explicit version.
/// </summary>
internal static class MaintenanceMapping
{
    public static MaintenanceRequestSummaryDto ToSummary(MaintenanceRequest r) => new()
    {
        Id = r.Id,
        PropertyId = r.PropertyId,
        PropertyName = r.Property?.Name,
        TenantName = DisplayName(r.Tenant),
        Title = r.Title,
        Category = r.Category,
        CategoryName = r.Category.ToString(),
        Urgency = r.Urgency,
        UrgencyName = r.Urgency.ToString(),
        Status = r.Status,
        StatusName = r.Status.ToString(),
        RequiresUrgentEscalation = r.RequiresUrgentEscalation,
        CreatedAtUtc = r.CreatedAtUtc
    };

    public static MaintenanceRequestDto ToDto(MaintenanceRequest r) => new()
    {
        Id = r.Id,
        PropertyId = r.PropertyId,
        PropertyName = r.Property?.Name,
        PropertyAddress = r.Property?.Address,
        TenantId = r.TenantId,
        TenantName = DisplayName(r.Tenant),
        TenantEmail = r.Tenant?.User?.Email,
        TenantPhone = r.Tenant?.PhoneNumber,
        Title = r.Title,
        Description = r.Description,
        Category = r.Category,
        CategoryName = r.Category.ToString(),
        Urgency = r.Urgency,
        UrgencyName = r.Urgency.ToString(),
        Status = r.Status,
        StatusName = r.Status.ToString(),
        RequiresUrgentEscalation = r.RequiresUrgentEscalation,
        EscalationReason = r.EscalationReason,
        AiCategory = r.AiCategory,
        AiUrgency = r.AiUrgency,
        TenantOverrodeAgent = r.Category != r.AiCategory || r.Urgency != r.AiUrgency,
        AiSummary = r.AiSummary,
        AiReasoning = r.AiReasoning,
        AiConfidence = r.AiConfidence,
        AiModel = r.AiModel,
        ProposedLandlordMessage = r.ProposedLandlordMessage,
        AgentToolTrace = r.AgentToolTrace,
        CreatedAtUtc = r.CreatedAtUtc,
        UpdatedAtUtc = r.UpdatedAtUtc,
        Events = r.Events
            .OrderBy(e => e.CreatedAtUtc)
            .ThenBy(e => e.Id)
            .Select(ToEventDto)
            .ToList()
    };

    /// <summary>
    /// How to refer to the tenant: their name, or their email when the profile has no name
    /// on it. Registration does not ask for a name, so falling back to the email is what
    /// stops a landlord's queue showing a list of anonymous rows.
    /// </summary>
    private static string? DisplayName(Tenant? tenant)
    {
        if (tenant is null) return null;

        var name = string.Join(' ', new[] { tenant.FirstName, tenant.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part))).Trim();

        return string.IsNullOrWhiteSpace(name) ? tenant.User?.Email : name;
    }

    public static MaintenanceRequestEventDto ToEventDto(MaintenanceRequestEvent e) => new()
    {
        Id = e.Id,
        EventType = e.EventType,
        EventTypeName = e.EventType.ToString(),
        Detail = e.Detail,
        CreatedAtUtc = e.CreatedAtUtc
    };
}
