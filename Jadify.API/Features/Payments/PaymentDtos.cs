namespace Jadify.API.Features.Payments;

public record CreatePaymentIntentRequest(Guid BookingId);

public record CreatePaymentIntentResponse(
    string ClientSecret,
    string PaymentIntentId
);

public record PaymentDto(
    Guid    Id,
    Guid    BookingId,
    decimal Amount,
    decimal FeeAmount,
    string? StripeChargeId,
    string  Status,
    DateTime CreatedAt
);
