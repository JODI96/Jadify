using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Helpers;
using Jadify.API.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Bookings;

public class AvailabilityService(JadifyDbContext db) : IAvailabilityService
{
    // Start times are offered at 30-minute boundaries regardless of service duration.
    private const int SlotIntervalMinutes = 30;

    public async Task<IReadOnlyList<TimeSlot>> GetAvailableSlotsAsync(
        Guid businessId, Guid? staffId, Guid serviceId, DateOnly date,
        CancellationToken ct = default)
    {
        // 1. Verify service belongs to this business and get its duration
        var service = await db.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.BusinessId == businessId && s.IsActive, ct)
            ?? throw new KeyNotFoundException($"Service {serviceId} not found for business {businessId}");

        // 2. Get business hours for the requested day
        var hours = await db.BusinessHours
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.BusinessId == businessId && h.DayOfWeek == date.DayOfWeek, ct);

        if (hours is null || hours.IsClosed)
            return [];

        // 3. Resolve which staff members are relevant
        IEnumerable<Guid> relevantStaffIds;
        if (staffId.HasValue)
        {
            relevantStaffIds = [staffId.Value];
        }
        else
        {
            // Any active staff member who can perform this service
            relevantStaffIds = await db.StaffServices
                .AsNoTracking()
                .Where(ss => ss.ServiceId == serviceId && ss.Staff.BusinessId == businessId && ss.Staff.IsActive)
                .Select(ss => ss.StaffId)
                .ToListAsync(ct);
        }

        var staffIdList = relevantStaffIds.ToList();
        if (staffIdList.Count == 0)
            return [];

        // 4. Load existing non-cancelled bookings for those staff on that date
        var dayStart = DateTimeHelper.Combine(date, TimeOnly.MinValue);
        var dayEnd   = dayStart.AddDays(1);

        var takenSlots = await db.Bookings
            .AsNoTracking()
            .Where(b => staffIdList.Contains(b.StaffId)
                     && b.Status != BookingStatus.Cancelled
                     && b.StartTime >= dayStart
                     && b.StartTime < dayEnd)
            .Select(b => new { b.StaffId, b.StartTime, b.EndTime })
            .ToListAsync(ct);

        // 5. Generate all possible start times at SlotIntervalMinutes boundaries
        var open  = DateTimeHelper.Combine(date, hours.OpenTime);
        var close = DateTimeHelper.Combine(date, hours.CloseTime);

        var available = new List<TimeSlot>();

        foreach (var slotStart in DateTimeHelper.GenerateSlots(open, close, SlotIntervalMinutes))
        {
            var slotEnd = slotStart.AddMinutes(service.DurationMinutes);

            // Slot must fit entirely within business hours
            if (slotEnd > close)
                break;

            // For each candidate staff, check if this slot is free for at least one of them.
            // If staffId was specified, we only check that one person.
            var hasAvailableStaff = staffIdList.Any(sid =>
                !takenSlots.Any(b =>
                    b.StaffId == sid &&
                    slotStart < b.EndTime &&
                    slotEnd   > b.StartTime));

            if (hasAvailableStaff)
                available.Add(new TimeSlot(slotStart, slotEnd));
        }

        return available;
    }
}
