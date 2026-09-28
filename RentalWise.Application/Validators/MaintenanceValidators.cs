using FluentValidation;
using RentalWise.Application.DTOs.Maintenance;
using RentalWise.Domain.Enum;

namespace RentalWise.Application.Validators;

/// <summary>
/// Validates a triage request. Picked up automatically by
/// AddValidatorsFromAssemblyContaining, like the property validators.
/// </summary>
public class MaintenanceTriageRequestDtoValidator : AbstractValidator<MaintenanceTriageRequestDto>
{
    public MaintenanceTriageRequestDtoValidator()
    {
        RuleFor(x => x.PropertyId)
            .GreaterThan(0).WithMessage("A property must be selected.");

        RuleFor(x => x.Messages)
            .NotEmpty().WithMessage("Describe the problem before asking for an assessment.");

        // Caps the conversation so a client cannot drive up model cost without limit.
        RuleFor(x => x.Messages)
            .Must(m => m.Count <= 12)
            .WithMessage("This conversation is too long. Start a new report.");

        RuleForEach(x => x.Messages).ChildRules(message =>
        {
            message.RuleFor(m => m.Content)
                .NotEmpty().WithMessage("Messages cannot be empty.")
                .MaximumLength(2000).WithMessage("Each message must be 2000 characters or fewer.");
        });
    }
}

/// <summary>
/// Validates the tenant's approval of an agent draft. Note that Unknown is rejected for
/// both category and urgency: an approved request must be classified.
/// </summary>
public class CreateMaintenanceRequestDtoValidator : AbstractValidator<CreateMaintenanceRequestDto>
{
    public CreateMaintenanceRequestDtoValidator()
    {
        RuleFor(x => x.PropertyId)
            .GreaterThan(0).WithMessage("A property must be selected.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("A title is required.")
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("A description is required.")
            .MaximumLength(4000);

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Unrecognised category.")
            .NotEqual(MaintenanceCategory.Unknown).WithMessage("Choose a category before submitting.");

        RuleFor(x => x.Urgency)
            .IsInEnum().WithMessage("Unrecognised urgency.")
            .NotEqual(MaintenanceUrgency.Unknown).WithMessage("Choose an urgency before submitting.");

        RuleFor(x => x.AiCategory).IsInEnum();
        RuleFor(x => x.AiUrgency).IsInEnum();

        RuleFor(x => x.IdempotencyKey)
            .NotEqual(Guid.Empty)
            .WithMessage("Missing idempotency key. Re-run the assessment and submit again.");

        RuleFor(x => x.AiConfidence)
            .InclusiveBetween(0d, 1d)
            .When(x => x.AiConfidence.HasValue)
            .WithMessage("Confidence must be between 0 and 1.");

        RuleFor(x => x.AiSummary).MaximumLength(1000);
        RuleFor(x => x.AiReasoning).MaximumLength(2000);
        RuleFor(x => x.ProposedLandlordMessage).MaximumLength(2000);
        RuleFor(x => x.AiModel).MaximumLength(100);
    }
}

/// <summary>Validates a landlord's status change.</summary>
public class UpdateMaintenanceStatusDtoValidator : AbstractValidator<UpdateMaintenanceStatusDto>
{
    public UpdateMaintenanceStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Unrecognised status.");
    }
}
