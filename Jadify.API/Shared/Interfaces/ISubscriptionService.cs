using Jadify.API.Features.Subscriptions;
using Jadify.API.Shared.Enums;

namespace Jadify.API.Shared.Interfaces;

public interface ISubscriptionService
{
    Task<SubscriptionResponse?> GetForBusinessAsync(Guid businessId, CancellationToken ct = default);

    Task<SubscriptionResponse> CreateAsync(
        Guid businessId, SubscriptionTier tier, CancellationToken ct = default);

    Task<SubscriptionResponse> ChangeTierAsync(
        Guid businessId, SubscriptionTier newTier, CancellationToken ct = default);

    Task CancelAsync(Guid businessId, CancellationToken ct = default);

    /// <summary>Syncs tier, status and period-end from Stripe — called by the webhook handler.</summary>
    Task SyncFromStripeAsync(string stripeSubscriptionId, CancellationToken ct = default);
}
