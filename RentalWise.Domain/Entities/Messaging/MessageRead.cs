namespace RentalWise.Domain.Entities.Messaging;

/// <summary>
/// Read receipt. Composite key (MessageId, UserId) - one row per reader per message.
/// </summary>
public class MessageRead
{
    public Guid MessageId { get; set; }

    public Message Message { get; set; } = null!;

    /// <summary>Identity user id of the reader.</summary>
    public Guid UserId { get; set; }

    public DateTime ReadAtUtc { get; set; }
}
