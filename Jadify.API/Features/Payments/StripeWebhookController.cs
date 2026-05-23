using System.Text;
using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Jadify.API.Features.Payments;

/// <summary>
/// Receives and verifies Stripe webhook events.
/// Must NOT use [FromBody] — the raw request body is required for signature validation.
/// </summary>
[ApiController]
[Route("api/payments/webhook")]
[AllowAnonymous]
public class StripeWebhookController(
    IPaymentService paymentService,
    ISubscriptionService subscriptionService,
    IConfiguration config,
    ILogger<StripeWebhookController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            rawBody = await reader.ReadToEndAsync(ct);

        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? string.Empty;
        var secret    = config["Stripe:WebhookSecret"] ?? string.Empty;

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(rawBody, signature, secret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            logger.LogWarning("Stripe webhook signature validation failed: {Message}", ex.Message);
            return BadRequest(new { error = "Invalid Stripe signature" });
        }

        logger.LogInformation("Stripe webhook received: {EventType} ({EventId})",
            stripeEvent.Type, stripeEvent.Id);

        switch (stripeEvent.Type)
        {
            case "payment_intent.succeeded":
            {
                if (stripeEvent.Data.Object is PaymentIntent intent)
                    await paymentService.HandlePaymentSucceededAsync(
                        intent.Id, intent.LatestChargeId ?? string.Empty, ct);
                break;
            }

            case "payment_intent.payment_failed":
            {
                if (stripeEvent.Data.Object is PaymentIntent intent)
                    await paymentService.HandlePaymentFailedAsync(intent.Id, ct);
                break;
            }

            case "customer.subscription.updated":
            case "customer.subscription.deleted":
            {
                if (stripeEvent.Data.Object is Subscription sub)
                    await subscriptionService.SyncFromStripeAsync(sub.Id, ct);
                break;
            }

            default:
                // Acknowledge all unhandled event types — any non-2xx triggers Stripe retries
                logger.LogDebug("Unhandled Stripe event type: {Type}", stripeEvent.Type);
                break;
        }

        // Always return 200 to Stripe — any non-2xx triggers automatic retries
        return Ok();
    }
}
