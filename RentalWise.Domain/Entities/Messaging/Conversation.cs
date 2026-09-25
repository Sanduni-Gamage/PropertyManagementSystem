namespace RentalWise.Domain.Entities.Messaging;

/// <summary>
/// A message thread, optionally anchored to a property listing.
/// </summary>
public class Conversation
{
    public Guid Id { get; set; }

    /// <summary>
    /// Listing the conversation is about, if any. Intentionally not a foreign key
    /// to <see cref="Property"/> so a conversation outlives a delisted property.
    /// </summary>
    public Guid? PropertyId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public bool IsArchived { get; set; }

    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
