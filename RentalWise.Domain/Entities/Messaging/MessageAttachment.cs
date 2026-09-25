namespace RentalWise.Domain.Entities.Messaging;

/// <summary>
/// A file attached to a message. The bytes live in Cloudinary; only the URL is stored.
/// </summary>
public class MessageAttachment
{
    public Guid Id { get; set; }

    public Guid MessageId { get; set; }

    public Message Message { get; set; } = null!;

    public string FileName { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public string Url { get; set; } = null!;

    public long SizeBytes { get; set; }
}
