namespace RentalWise.Domain.Enum;

/// <summary>
/// The capacity in which a user takes part in a conversation.
/// Stored as int; values must stay stable once data exists.
/// </summary>
public enum ParticipantRole
{
    Tenant = 0,
    Landlord = 1,
    Admin = 2
}
