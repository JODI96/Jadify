using Jadify.API.Features.Payments;

namespace Jadify.API.Shared.Interfaces;

public interface IPaymentService
{
    /// <summary>
    /// Returns the existing PaymentIntent client_secret if it is still actionable,
    /// or creates a fresh one for the given booking.
    /// </summary>
    Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
        Guid bookingId, CancellationToken ct = default);

    /// <summary>Called by the Stripe webhook on payment_intent.succeeded.</summary>
    Task HandlePaymentSucceededAsync(
        string stripePaymentIntentId, string stripeChargeId, CancellationToken ct = default);

    /// <summary>Called by the Stripe webhook on payment_intent.payment_failed.</summary>
    Task HandlePaymentFailedAsync(
        string stripePaymentIntentId, CancellationToken ct = default);
}
