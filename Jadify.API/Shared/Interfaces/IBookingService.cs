using Jadify.API.Features.Bookings;
using Jadify.API.Shared.Enums;

namespace Jadify.API.Shared.Interfaces;

public interface IBookingService
{
    Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(CreatePaymentIntentRequest request, CancellationToken ct = default);
    Task<BookingResponse> CreateAsync(CreateBookingRequest request, CancellationToken ct = default);
    Task<BookingResponse> ConfirmAsync(Guid bookingId, CancellationToken ct = default);
    Task<BookingResponse> CancelAsync(Guid bookingId, string? reason, CancellationToken ct = default);
    Task<BookingResponse?> GetByIdAsync(Guid bookingId, CancellationToken ct = default);

    Task<IReadOnlyList<BookingSummaryDto>> GetForBusinessAsync(
        Guid businessId, DateOnly? date, BookingStatus? status, CancellationToken ct = default);

    Task<BookingResponse> CancelByCustomerAsync(Guid bookingId, string token, CancellationToken ct = default);
}
