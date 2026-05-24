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
        List<Guid> staffIdList;
        if (staffId.HasValue)
        {
            staffIdList = [staffId.Value];
        }
        else
        {
            // Prefer staff explicitly linked to this service; fall back to all active staff
            staffIdList = await db.StaffServices
                .AsNoTracking()
                .Where(ss => ss.ServiceId == serviceId && ss.Staff.BusinessId == businessId && ss.Staff.IsActive)
                .Select(ss => ss.StaffId)
                .ToListAsync(ct);

            if (staffIdList.Count == 0)
                staffIdList = await db.Staff
                    .AsNoTracking()
                    .Where(s => s.BusinessId == businessId && s.IsActive)
                    .Select(s => s.Id)
                    .ToListAsync(ct);
        }

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

    public async Task<IReadOnlyList<DateOnly>> GetAvailableDatesAsync(
        Guid businessId, Guid? staffId, Guid serviceId,
        int year, int month, CancellationToken ct = default)
    {
        var service = await db.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.BusinessId == businessId && s.IsActive, ct)
            ?? throw new KeyNotFoundException($"Service {serviceId} not found");

        var allHours = await db.BusinessHours
            .AsNoTracking()
            .Where(h => h.BusinessId == businessId)
            .ToListAsync(ct);

        List<Guid> staffIds;
        if (staffId.HasValue)
        {
            staffIds = [staffId.Value];
        }
        else
        {
            staffIds = await db.StaffServices
                .AsNoTracking()
                .Where(ss => ss.ServiceId == serviceId && ss.Staff.BusinessId == businessId && ss.Staff.IsActive)
                .Select(ss => ss.StaffId)
                .ToListAsync(ct);

            if (staffIds.Count == 0)
                staffIds = await db.Staff
                    .AsNoTracking()
                    .Where(s => s.BusinessId == businessId && s.IsActive)
                    .Select(s => s.Id)
                    .ToListAsync(ct);
        }

        if (staffIds.Count == 0) return [];

        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd   = monthStart.AddMonths(1);

        var bookings = await db.Bookings
            .AsNoTracking()
            .Where(b => staffIds.Contains(b.StaffId)
                     && b.Status != BookingStatus.Cancelled
                     && b.StartTime >= monthStart
                     && b.StartTime < monthEnd)
            .Select(b => new { b.StaffId, b.StartTime, b.EndTime })
            .ToListAsync(ct);

        var today     = DateOnly.FromDateTime(DateTime.UtcNow);
        var available = new List<DateOnly>();

        for (int day = 1; day <= DateTime.DaysInMonth(year, month); day++)
        {
            var date = new DateOnly(year, month, day);
            if (date < today) continue;

            var hours = allHours.FirstOrDefault(h => h.DayOfWeek == date.DayOfWeek);
            if (hours is null || hours.IsClosed) continue;

            var open  = DateTimeHelper.Combine(date, hours.OpenTime);
            var close = DateTimeHelper.Combine(date, hours.CloseTime);

            var dayBookings = bookings
                .Where(b => b.StartTime >= open && b.StartTime < close)
                .ToList();

            bool hasSlot = false;
            foreach (var slotStart in DateTimeHelper.GenerateSlots(open, close, SlotIntervalMinutes))
            {
                var slotEnd = slotStart.AddMinutes(service.DurationMinutes);
                if (slotEnd > close) break;

                if (staffIds.Any(sid => !dayBookings.Any(b =>
                        b.StaffId == sid &&
                        slotStart < b.EndTime &&
                        slotEnd   > b.StartTime)))
                {
                    hasSlot = true;
                    break;
                }
            }

            if (hasSlot) available.Add(date);
        }

        return available;
    }
}
