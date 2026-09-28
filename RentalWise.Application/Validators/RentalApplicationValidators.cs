using FluentValidation;
using RentalWise.Application.DTOs.Applications;

namespace RentalWise.Application.Validators;

public class CreateRentalApplicationDtoValidator : AbstractValidator<CreateRentalApplicationDto>
{
    public CreateRentalApplicationDtoValidator()
    {
        RuleFor(x => x.PropertyId)
            .GreaterThan(0).WithMessage("A property must be selected.");

        RuleFor(x => x.Message)
            .MaximumLength(1000).WithMessage("Keep your note to 1000 characters or fewer.");
    }
}

public class ApproveRentalApplicationDtoValidator : AbstractValidator<ApproveRentalApplicationDto>
{
    public ApproveRentalApplicationDtoValidator()
    {
        // Dates and rent are all optional and default from the listing; only reject values
        // that cannot possibly be right.
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("The lease must end after it starts.");

        RuleFor(x => x.RentAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.RentAmount.HasValue)
            .WithMessage("Rent cannot be negative.");

        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class DeclineRentalApplicationDtoValidator : AbstractValidator<DeclineRentalApplicationDto>
{
    public DeclineRentalApplicationDtoValidator()
    {
        RuleFor(x => x.Note).MaximumLength(500);
    }
}
