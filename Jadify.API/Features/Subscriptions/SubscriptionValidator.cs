using FluentValidation;
using Jadify.API.Shared.Enums;

namespace Jadify.API.Features.Subscriptions;

public class CreateSubscriptionRequestValidator : AbstractValidator<CreateSubscriptionRequest>
{
    public CreateSubscriptionRequestValidator()
    {
        RuleFor(x => x.Tier)
            .IsInEnum()
            .Must(t => t != SubscriptionTier.Free)
            .WithMessage("Use the cancel endpoint to return to the Free tier");
    }
}

public class ChangeTierRequestValidator : AbstractValidator<ChangeTierRequest>
{
    public ChangeTierRequestValidator()
    {
        RuleFor(x => x.NewTier)
            .IsInEnum()
            .Must(t => t != SubscriptionTier.Free)
            .WithMessage("Use the cancel endpoint to return to the Free tier");
    }
}
