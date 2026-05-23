using Jadify.API.Features.Bookings;

namespace Jadify.API.Shared.Interfaces;

public interface IAvailabilityService
{
    /// <summary>
    /// Returns all available start slots (at 30-minute intervals) for a given
    /// service on a given date. If staffId is omitted, any staff who can perform
    /// the service is considered.
    /// </summary>
    Task<IReadOnlyList<TimeSlot>> GetAvailableSlotsAsync(
        Guid    businessId,
        Guid?   staffId,
        Guid    serviceId,
        DateOnly date,
        CancellationToken ct = default);
}
