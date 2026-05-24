namespace Jadify.API.Features.Bookings;

// ── Availability ──────────────────────────────────────────────────────────────

public record TimeSlot(DateTime Start, DateTime End);

// ── Create ────────────────────────────────────────────────────────────────────

// Step 1: get a Stripe PaymentIntent without saving anything to the database
public record CreatePaymentIntentRequest(
    Guid     BusinessId,
    Guid?    StaffId,
    Guid     ServiceId,
    DateTime StartTime
);

public record CreatePaymentIntentResponse(string ClientSecret, decimal Amount);

// Step 2: create the booking AFTER payment is confirmed
public record CreateBookingRequest(
    Guid     BusinessId,
    Guid?    StaffId,
    Guid     ServiceId,
    DateTime StartTime,
    string   CustomerName,
    string   CustomerEmail,
    string?  CustomerPhone,
    string?  Notes,
    string?  PaymentIntentId   // provided after Stripe payment succeeds
);

// ── Cancel ────────────────────────────────────────────────────────────────────

public record CancelBookingRequest(string? Reason);

// ── Responses ─────────────────────────────────────────────────────────────────

public record BookingResponse(
    Guid     Id,
    string   BusinessName,
    string   StaffName,
    string   ServiceName,
    string   CustomerName,
    string   CustomerEmail,
    DateTime StartTime,
    DateTime EndTime,
    string   Status,
    decimal  TotalAmount,
    decimal  FeeAmount,
    string?  ClientSecret,   // Stripe PaymentIntent client_secret — only set on create
    string?  Notes,
    DateTime CreatedAt
);

public record BookingSummaryDto(
    Guid     Id,
    string   CustomerName,
    string   CustomerEmail,
    string   ServiceName,
    string   StaffName,
    DateTime StartTime,
    DateTime EndTime,
    string   Status,
    decimal  TotalAmount
);
