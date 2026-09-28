namespace RentalWise.Application.Services.Maintenance;

/// <summary>
/// The caller is authenticated but not entitled to act on this property or request.
/// Mapped to 403 by the controller.
/// </summary>
public class MaintenanceAuthorizationException : Exception
{
    public MaintenanceAuthorizationException(string message) : base(message) { }
}

/// <summary>
/// The agent ran but could not produce a usable assessment - the model returned
/// unparseable or invalid output, or the provider failed. Mapped to 502, because the
/// failure is upstream of the caller rather than their fault.
/// </summary>
public class AgentAssessmentException : Exception
{
    public AgentAssessmentException(string message, Exception? inner = null) : base(message, inner) { }
}

/// <summary>
/// A similar request is already open for this property. Mapped to 409, carrying the id of
/// the existing request so the UI can link to it.
/// </summary>
public class DuplicateMaintenanceRequestException : Exception
{
    public DuplicateMaintenanceRequestException(int existingRequestId, string message) : base(message)
    {
        ExistingRequestId = existingRequestId;
    }

    public int ExistingRequestId { get; }
}
