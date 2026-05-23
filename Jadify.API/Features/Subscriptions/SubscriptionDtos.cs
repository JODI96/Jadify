using Jadify.API.Shared.Enums;

namespace Jadify.API.Features.Subscriptions;

public record SubscriptionResponse(
    Guid      Id,
    Guid      BusinessId,
    string    Tier,
    bool      IsActive,
    DateTime? CurrentPeriodEnd,
    bool      CancelAtPeriodEnd,
    string?   StripeSubscriptionId,
    /// <summary>Stripe PaymentIntent client_secret for the first invoice — only set on initial creation.</summary>
    string?   ClientSecret,
    DateTime  CreatedAt
);

public record CreateSubscriptionRequest(SubscriptionTier Tier);

public record ChangeTierRequest(SubscriptionTier NewTier);
