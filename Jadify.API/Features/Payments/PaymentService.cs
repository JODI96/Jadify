using Jadify.API.Shared.Constants;
using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Interfaces;
using Jadify.API.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Payment = Jadify.API.Shared.Models.Payment;

namespace Jadify.API.Features.Payments;

public class PaymentService(
    JadifyDbContext db,
    IStripeClient stripeClient,
    IEmailService emailService,
    ILogger<PaymentService> logger) : IPaymentService
{
    public async Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
        Guid bookingId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Business)
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found");

        if (booking.Status == BookingStatus.Cancelled)
            throw new InvalidOperationException("Cannot create a payment intent for a cancelled booking");

        var piService = new PaymentIntentService(stripeClient);

        // Reuse the existing intent if it is still in an actionable state
        if (booking.StripePaymentIntentId is not null)
        {
            var existing = await piService.GetAsync(booking.StripePaymentIntentId, cancellationToken: ct);
            if (existing.Status is "requires_payment_method" or "requires_confirmation" or "requires_action")
                return new CreatePaymentIntentResponse(existing.ClientSecret!, existing.Id);
        }

        // Recalculate fee in case the tier changed since the booking was created
        var subscription = await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.BusinessId == booking.BusinessId, ct);

        var feePercent = (subscription?.Tier ?? SubscriptionTier.Free) switch
        {
            SubscriptionTier.Growth => JadifyConstants.Tiers.GrowthFeePercent,
            SubscriptionTier.Pro    => JadifyConstants.Tiers.ProFeePercent,
            _                       => JadifyConstants.Tiers.FreeFeePercent
        };
        var feeAmount = Math.Round(booking.TotalAmount * feePercent, 2);

        var options = new PaymentIntentCreateOptions
        {
            Amount   = ToStripeAmount(booking.TotalAmount),
            Currency = "chf",
            Metadata = new Dictionary<string, string>
            {
                ["booking_id"]  = booking.Id.ToString(),
                ["business_id"] = booking.BusinessId.ToString()
            }
        };

        if (feeAmount > 0)
            options.ApplicationFeeAmount = ToStripeAmount(feeAmount);

        var intent = await piService.CreateAsync(options, cancellationToken: ct);

        booking.FeeAmount             = feeAmount;
        booking.StripePaymentIntentId = intent.Id;
        await db.SaveChangesAsync(ct);

        return new CreatePaymentIntentResponse(intent.ClientSecret!, intent.Id);
    }

    public async Task HandlePaymentSucceededAsync(
        string stripePaymentIntentId, string stripeChargeId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.StripePaymentIntentId == stripePaymentIntentId, ct);

        if (booking is null)
        {
            logger.LogWarning("payment_intent.succeeded received for unknown intent {Id}", stripePaymentIntentId);
            return;
        }

        // Idempotency guard — Stripe may deliver the same event more than once
        if (booking.Status == BookingStatus.Confirmed)
        {
            logger.LogInformation("Booking {Id} already confirmed — skipping duplicate webhook", booking.Id);
            return;
        }

        booking.Status = BookingStatus.Confirmed;

        var alreadyRecorded = await db.Payments.AnyAsync(p => p.BookingId == booking.Id, ct);
        if (!alreadyRecorded)
        {
            db.Payments.Add(new Payment
            {
                BookingId     = booking.Id,
                Amount        = booking.TotalAmount,
                FeeAmount     = booking.FeeAmount,
                StripeChargeId = stripeChargeId,
                Status        = "succeeded"
            });
        }

        await db.SaveChangesAsync(ct);

        logger.LogInformation("Booking {Id} confirmed via Stripe webhook (charge {ChargeId})",
            booking.Id, stripeChargeId);

        // Best-effort confirmation email
        _ = emailService
            .SendBookingConfirmationAsync(booking.Customer.Email, booking.Customer.Name, booking.Id)
            .ContinueWith(t => logger.LogWarning(t.Exception,
                "Confirmation email failed for booking {Id}", booking.Id),
                TaskContinuationOptions.OnlyOnFaulted);
    }

    public async Task HandlePaymentFailedAsync(
        string stripePaymentIntentId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.StripePaymentIntentId == stripePaymentIntentId, ct);

        if (booking is null)
        {
            logger.LogWarning("payment_intent.payment_failed received for unknown intent {Id}", stripePaymentIntentId);
            return;
        }

        if (booking.Status is BookingStatus.Cancelled or BookingStatus.Confirmed)
            return;

        booking.Status = BookingStatus.Cancelled;
        booking.Notes  = "Cancelled: payment failed";
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Booking {Id} cancelled due to payment failure (intent {IntentId})",
            booking.Id, stripePaymentIntentId);
    }

    private static long ToStripeAmount(decimal chf) => (long)(chf * 100);
}
