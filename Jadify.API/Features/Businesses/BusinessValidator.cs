using FluentValidation;

namespace Jadify.API.Features.Businesses;

public class UpdateBusinessRequestValidator : AbstractValidator<UpdateBusinessRequest>
{
    public UpdateBusinessRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}

public class BusinessHoursItemRequestValidator : AbstractValidator<BusinessHoursItemRequest>
{
    public BusinessHoursItemRequestValidator()
    {
        RuleFor(x => x.DayOfWeek).IsInEnum();

        When(x => !x.IsClosed, () =>
        {
            RuleFor(x => x.CloseTime)
                .GreaterThan(x => x.OpenTime)
                .WithMessage("CloseTime must be after OpenTime");
        });
    }
}

public class SetBusinessHoursRequestValidator : AbstractValidator<SetBusinessHoursRequest>
{
    public SetBusinessHoursRequestValidator()
    {
        RuleForEach(x => x.Hours).SetValidator(new BusinessHoursItemRequestValidator());

        RuleFor(x => x.Hours)
            .Must(h => h.Select(x => x.DayOfWeek).Distinct().Count() == h.Count)
            .WithMessage("Each day of the week may appear at most once");
    }
}
