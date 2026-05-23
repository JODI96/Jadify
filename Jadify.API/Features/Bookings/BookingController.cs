using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Features.Bookings;

[ApiController]
public class BookingController(
    IBookingService bookingService,
    IAvailabilityService availabilityService) : ControllerBase
{
    /// <summary>
    /// Returns available time slots for a service on a given date.
    /// All times are UTC. staffId is optional — omit to find any available staff.
    /// </summary>
    [HttpGet("api/availability")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TimeSlot>>> GetAvailability(
        [FromQuery] Guid    businessId,
        [FromQuery] Guid    serviceId,
        [FromQuery] DateOnly date,
        [FromQuery] Guid?   staffId,
        CancellationToken   ct)
        => Ok(await availabilityService.GetAvailableSlotsAsync(businessId, staffId, serviceId, date, ct));

    /// <summary>
    /// Creates a booking and a Stripe PaymentIntent. Returns the PaymentIntent
    /// clientSecret so the frontend can complete the payment with Stripe Elements.
    /// </summary>
    [HttpPost("api/bookings")]
    [AllowAnonymous]
    public async Task<ActionResult<BookingResponse>> Create(
        CreateBookingRequest request, CancellationToken ct)
    {
        var response = await bookingService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    /// <summary>Gets a booking by ID.</summary>
    [HttpGet("api/bookings/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<BookingResponse>> GetById(Guid id, CancellationToken ct)
    {
        var booking = await bookingService.GetByIdAsync(id, ct);
        return booking is null ? NotFound() : Ok(booking);
    }

    /// <summary>Confirms a booking after successful payment. Idempotent.</summary>
    [HttpPut("api/bookings/{id:guid}/confirm")]
    [Authorize]
    public async Task<ActionResult<BookingResponse>> Confirm(Guid id, CancellationToken ct)
        => Ok(await bookingService.ConfirmAsync(id, ct));

    /// <summary>Cancels a booking. Triggers a Stripe refund if payment was already captured.</summary>
    [HttpPut("api/bookings/{id:guid}/cancel")]
    [Authorize]
    public async Task<ActionResult<BookingResponse>> Cancel(
        Guid id, CancelBookingRequest request, CancellationToken ct)
        => Ok(await bookingService.CancelAsync(id, request.Reason, ct));

    /// <summary>Lists bookings for a business on a given date.</summary>
    [HttpGet("api/businesses/{businessId:guid}/bookings")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<BookingSummaryDto>>> GetForBusiness(
        Guid              businessId,
        [FromQuery] DateOnly date,
        [FromQuery] BookingStatus? status,
        CancellationToken ct)
        => Ok(await bookingService.GetForBusinessAsync(businessId, date, status, ct));
}
