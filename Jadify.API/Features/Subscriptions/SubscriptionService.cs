using Jadify.API.Shared.Constants;
using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using LocalSubscription = Jadify.API.Shared.Models.Subscription;

namespace Jadify.API.Features.Subscriptions;

public class SubscriptionService(
    JadifyDbContext db,
    StripeSubscriptionService stripe,
    ILogger<SubscriptionService> logger) : ISubscriptionService
{
    public async Task<SubscriptionResponse?> GetForBusinessAsync(
        Guid businessId, CancellationToken ct = default)
    {
        var sub = await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.BusinessId == businessId, ct);

        return sub is null ? null : ToResponse(sub, clientSecret: null);
    }

    public async Task<SubscriptionResponse> CreateAsync(
        Guid businessId, SubscriptionTier tier, CancellationToken ct = default)
    {
        var business = await db.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == businessId, ct)
            ?? throw new KeyNotFoundException($"Business {businessId} not found");

        var sub = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.BusinessId == businessId, ct)
            ?? throw new InvalidOperationException(
                "Subscription record missing — ensure business was created via auth/register");

        if (sub.StripeSubscriptionId is not null)
            throw new InvalidOperationException(
                "An active paid subscription already exists. Use the upgrade endpoint to change tier.");

        var priceId = PriceIdForTier(tier);

        var customerId = await stripe.GetOrCreateCustomerAsync(
            business.Email, business.Name, businessId, sub.StripeCustomerId, ct);

        var stripeSub = await stripe.CreateSubscriptionAsync(customerId, priceId, businessId, ct);

        sub.Tier                 = tier;
        sub.StripeSubscriptionId = stripeSub.Id;
        sub.StripeCustomerId     = customerId;
        sub.CurrentPeriodEnd     = stripeSub.Items.Data.FirstOrDefault()?.CurrentPeriodEnd;
        sub.IsActive             = stripeSub.Status is "active" or "trialing" or "incomplete";
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Subscription {SubId} created (tier={Tier}) for business {BusinessId}",
            stripeSub.Id, tier, businessId);

        // ClientSecret for the subscription's first invoice is returned separately via
        // POST /api/payments/create-intent if the frontend needs to complete payment.
        return ToResponse(sub, clientSecret: null);
    }

    public async Task<SubscriptionResponse> ChangeTierAsync(
        Guid businessId, SubscriptionTier newTier, CancellationToken ct = default)
    {
        var sub = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.BusinessId == businessId, ct)
            ?? throw new KeyNotFoundException($"No subscription found for business {businessId}");

        if (sub.StripeSubscriptionId is null)
            throw new InvalidOperationException(
                "No active paid subscription to change. Use the create endpoint.");

        if (sub.Tier == newTier)
            return ToResponse(sub, clientSecret: null);

        var priceId   = PriceIdForTier(newTier);
        var stripeSub = await stripe.UpdatePriceAsync(sub.StripeSubscriptionId, priceId, ct);

        sub.Tier             = newTier;
        sub.CurrentPeriodEnd = stripeSub.Items.Data.FirstOrDefault()?.CurrentPeriodEnd;
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Subscription {SubId} changed to tier {Tier} for business {BusinessId}",
            sub.StripeSubscriptionId, newTier, businessId);

        return ToResponse(sub, clientSecret: null);
    }

    public async Task CancelAsync(Guid businessId, CancellationToken ct = default)
    {
        var sub = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.BusinessId == businessId, ct)
            ?? throw new KeyNotFoundException($"No subscription found for business {businessId}");

        if (sub.StripeSubscriptionId is null)
            throw new InvalidOperationException("No active paid subscription to cancel");

        await stripe.CancelAtPeriodEndAsync(sub.StripeSubscriptionId, ct);

        // Do NOT update local state here — wait for the Stripe webhook to confirm cancellation.
        // The business retains full paid-tier access until the period actually ends.
        logger.LogInformation("Subscription {SubId} set to cancel at period end for business {BusinessId}",
            sub.StripeSubscriptionId, businessId);
    }

    public async Task SyncFromStripeAsync(string stripeSubscriptionId, CancellationToken ct = default)
    {
        var sub = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId, ct);

        if (sub is null)
        {
            logger.LogWarning("SyncFromStripe: no local subscription for Stripe sub {Id}",
                stripeSubscriptionId);
            return;
        }

        var stripeSub = await stripe.GetAsync(stripeSubscriptionId, ct);

        var priceId = stripeSub.Items.Data.FirstOrDefault()?.Price?.Id;
        sub.Tier = priceId switch
        {
            JadifyConstants.Stripe.GrowthPriceId => SubscriptionTier.Growth,
            JadifyConstants.Stripe.ProPriceId    => SubscriptionTier.Pro,
            _                                     => SubscriptionTier.Free
        };

        sub.CurrentPeriodEnd = stripeSub.Items.Data.FirstOrDefault()?.CurrentPeriodEnd;

        if (stripeSub.Status == "canceled")
        {
            // Subscription fully ended — drop back to Free, keep StripeCustomerId for re-subscribe
            sub.Tier                 = SubscriptionTier.Free;
            sub.StripeSubscriptionId = null;
            sub.CurrentPeriodEnd     = null;
            sub.IsActive             = true;
        }
        else
        {
            sub.IsActive = stripeSub.Status is "active" or "trialing";
        }

        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Subscription synced from Stripe: sub={SubId} status={Status} tier={Tier}",
            stripeSubscriptionId, stripeSub.Status, sub.Tier);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string PriceIdForTier(SubscriptionTier tier) => tier switch
    {
        SubscriptionTier.Growth => JadifyConstants.Stripe.GrowthPriceId,
        SubscriptionTier.Pro    => JadifyConstants.Stripe.ProPriceId,
        _ => throw new ArgumentException($"No Stripe price for tier {tier}")
    };

    private static SubscriptionResponse ToResponse(LocalSubscription s, string? clientSecret) =>
        new(s.Id, s.BusinessId, s.Tier.ToString(), s.IsActive,
            s.CurrentPeriodEnd,
            CancelAtPeriodEnd: false,
            s.StripeSubscriptionId,
            clientSecret,
            s.CreatedAt);
}
