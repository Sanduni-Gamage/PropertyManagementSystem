using RentalWise.Domain.Enum;

namespace RentalWise.Domain.Entities;

/// <summary>
/// Append-only audit entry for a <see cref="MaintenanceRequest"/>.
///
/// Exists so that "the agent did X, the policy decided Y, the human approved Z" can be
/// reconstructed later. Rows are never updated or deleted.
/// </summary>
public class MaintenanceRequestEvent
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }

    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    public MaintenanceEventType EventType { get; set; }

    /// <summary>Free text describing what happened, shown on the request timeline.</summary>
    public string? Detail { get; set; }

    /// <summary>Identity user who caused the event; null when the system did it.</summary>
    public Guid? ActorUserId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
