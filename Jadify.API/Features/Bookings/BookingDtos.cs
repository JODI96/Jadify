namespace Jadify.API.Features.Bookings;

// ── Availability ──────────────────────────────────────────────────────────────

public record TimeSlot(DateTime Start, DateTime End);

// ── Create ────────────────────────────────────────────────────────────────────

public record CreateBookingRequest(
    Guid    BusinessId,
    Guid?   StaffId,      // null = pick any available staff
    Guid    ServiceId,
    DateTime StartTime,
    string  CustomerName,
    string  CustomerEmail,
    string? CustomerPhone,
    string? Notes
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
    string   ServiceName,
    string   StaffName,
    DateTime StartTime,
    DateTime EndTime,
    string   Status,
    decimal  TotalAmount
);
