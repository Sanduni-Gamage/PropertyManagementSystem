using RentalWise.Domain.Enum;

namespace RentalWise.Domain.Entities.Messaging;

/// <summary>
/// Join row granting a user access to a conversation.
/// </summary>
public class ConversationParticipant
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Conversation Conversation { get; set; } = null!;

    /// <summary>Identity user id of the participant.</summary>
    public Guid UserId { get; set; }

    public ParticipantRole Role { get; set; }

    public DateTime JoinedAtUtc { get; set; }

    /// <summary>Set when the participant leaves; null while still a member.</summary>
    public DateTime? LeftAtUtc { get; set; }
}
