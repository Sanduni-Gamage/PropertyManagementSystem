namespace RentalWise.Domain.Entities.Messaging;

/// <summary>
/// A single message within a <see cref="Conversation"/>.
/// </summary>
public class Message
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Conversation Conversation { get; set; } = null!;

    /// <summary>Identity user id of the sender.</summary>
    public Guid SenderId { get; set; }

    public string Body { get; set; } = null!;

    /// <summary>
    /// Message this one replies to. Foreign key only - there is deliberately no
    /// navigation property, to keep the self-referencing graph out of change tracking.
    /// </summary>
    public Guid? ReplyToMessageId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    /// <summary>Set when the body is edited; null if never edited.</summary>
    public DateTime? EditedAtUtc { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();

    public ICollection<MessageRead> Reads { get; set; } = new List<MessageRead>();
}
