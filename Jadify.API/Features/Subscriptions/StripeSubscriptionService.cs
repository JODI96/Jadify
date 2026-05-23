using Stripe;
// Alias to avoid conflict with Jadify.API.Features.Subscriptions.SubscriptionService
using StripeSubSvc = Stripe.SubscriptionService;
using StripeSubscription = Stripe.Subscription;

namespace Jadify.API.Features.Subscriptions;

/// <summary>Thin wrapper around the Stripe Subscription and Customer APIs.</summary>
public class StripeSubscriptionService(
    IStripeClient stripeClient,
    ILogger<StripeSubscriptionService> logger)
{
    private readonly CustomerService _customers     = new(stripeClient);
    private readonly StripeSubSvc    _subscriptions = new(stripeClient);

    /// <summary>
    /// Returns the existing Stripe Customer ID, or creates a new Stripe Customer.
    /// </summary>
    public async Task<string> GetOrCreateCustomerAsync(
        string email, string name, Guid businessId,
        string? existingStripeCustomerId, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(existingStripeCustomerId))
            return existingStripeCustomerId;

        var customer = await _customers.CreateAsync(new CustomerCreateOptions
        {
            Email    = email,
            Name     = name,
            Metadata = new Dictionary<string, string>
            {
                ["business_id"] = businessId.ToString()
            }
        }, cancellationToken: ct);

        logger.LogInformation("Stripe Customer {CustomerId} created for business {BusinessId}",
            customer.Id, businessId);

        return customer.Id;
    }

    /// <summary>
    /// Creates a Stripe Subscription. Uses <c>default_incomplete</c> so the first
    /// invoice requires explicit payment confirmation from the frontend.
    /// </summary>
    public async Task<StripeSubscription> CreateSubscriptionAsync(
        string customerId, string priceId, Guid businessId, CancellationToken ct)
    {
        var options = new SubscriptionCreateOptions
        {
            Customer        = customerId,
            Items           = [new SubscriptionItemOptions { Price = priceId }],
            PaymentBehavior = "default_incomplete",
            Metadata        = new Dictionary<string, string>
            {
                ["business_id"] = businessId.ToString()
            }
        };

        return await _subscriptions.CreateAsync(options, cancellationToken: ct);
    }

    /// <summary>Swaps the price on the first subscription item (tier upgrade / downgrade).</summary>
    public async Task<StripeSubscription> UpdatePriceAsync(
        string subscriptionId, string newPriceId, CancellationToken ct)
    {
        var existing = await _subscriptions.GetAsync(subscriptionId, cancellationToken: ct);
        var itemId   = existing.Items.Data[0].Id;

        return await _subscriptions.UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
        {
            Items             = [new SubscriptionItemOptions { Id = itemId, Price = newPriceId }],
            ProrationBehavior = "create_prorations"
        }, cancellationToken: ct);
    }

    /// <summary>Sets cancel_at_period_end = true on the Stripe Subscription.</summary>
    public async Task<StripeSubscription> CancelAtPeriodEndAsync(
        string subscriptionId, CancellationToken ct)
        => await _subscriptions.UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
        {
            CancelAtPeriodEnd = true
        }, cancellationToken: ct);

    public async Task<StripeSubscription> GetAsync(string subscriptionId, CancellationToken ct)
        => await _subscriptions.GetAsync(subscriptionId, cancellationToken: ct);
}
