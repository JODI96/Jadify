using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Dashboard;

public class DashboardService(JadifyDbContext db) : IDashboardService
{
    public async Task<DashboardResponse> GetAsync(Guid businessId, CancellationToken ct = default)
    {
        var now           = DateTime.UtcNow;
        var todayStart    = now.Date;
        var todayEnd      = todayStart.AddDays(1);
        var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var thirtyDaysAgo  = todayStart.AddDays(-30);

        // EF Core DbContext is not thread-safe — execute sequentially.

        var todayBookingCount = await db.Bookings
            .Where(b => b.BusinessId == businessId
                     && b.StartTime >= todayStart
                     && b.StartTime < todayEnd
                     && b.Status != BookingStatus.Cancelled)
            .CountAsync(ct);

        var upcomingBookingCount = await db.Bookings
            .Where(b => b.BusinessId == businessId
                     && b.StartTime > now
                     && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending))
            .CountAsync(ct);

        var revenueThisMonth = await db.Payments
            .Where(p => p.Booking.BusinessId == businessId
                     && p.CreatedAt >= thisMonthStart
                     && p.Status == "succeeded")
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var revenueLastMonth = await db.Payments
            .Where(p => p.Booking.BusinessId == businessId
                     && p.CreatedAt >= lastMonthStart
                     && p.CreatedAt < thisMonthStart
                     && p.Status == "succeeded")
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var last30Total = await db.Bookings
            .Where(b => b.BusinessId == businessId && b.CreatedAt >= thirtyDaysAgo)
            .CountAsync(ct);

        var last30Cancelled = await db.Bookings
            .Where(b => b.BusinessId == businessId
                     && b.CreatedAt >= thirtyDaysAgo
                     && b.Status == BookingStatus.Cancelled)
            .CountAsync(ct);

        var totalCustomers = await db.Bookings
            .Where(b => b.BusinessId == businessId)
            .Select(b => b.CustomerId)
            .Distinct()
            .CountAsync(ct);

        var todaySchedule = await db.Bookings
            .Where(b => b.BusinessId == businessId
                     && b.StartTime >= todayStart
                     && b.StartTime < todayEnd)
            .OrderBy(b => b.StartTime)
            .Select(b => new UpcomingBookingItem(
                b.Id,
                b.Customer.Name,
                b.Service.Name,
                b.Staff.Name,
                b.StartTime,
                b.EndTime,
                b.Status.ToString()))
            .ToListAsync(ct);

        var growthPercent = revenueLastMonth == 0m
            ? (revenueThisMonth > 0m ? 100.0 : 0.0)
            : Math.Round((double)((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100), 1);

        var cancellationRate = last30Total == 0
            ? 0.0
            : Math.Round((double)last30Cancelled / last30Total * 100, 1);

        return new DashboardResponse(
            TodayBookingCount:      todayBookingCount,
            UpcomingBookingCount:   upcomingBookingCount,
            RevenueThisMonth:       revenueThisMonth,
            RevenueLastMonth:       revenueLastMonth,
            RevenueGrowthPercent:   growthPercent,
            CancellationRatePercent: cancellationRate,
            TotalCustomers:         totalCustomers,
            TodaySchedule:          todaySchedule);
    }
}
