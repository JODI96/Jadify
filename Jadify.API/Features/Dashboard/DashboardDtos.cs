namespace Jadify.API.Features.Dashboard;

public record DashboardResponse(
    int TodayBookingCount,
    int UpcomingBookingCount,
    decimal RevenueThisMonth,
    decimal RevenueLastMonth,
    double RevenueGrowthPercent,
    double CancellationRatePercent,
    int TotalCustomers,
    IReadOnlyList<UpcomingBookingItem> TodaySchedule);

public record UpcomingBookingItem(
    Guid Id,
    string CustomerName,
    string ServiceName,
    string StaffName,
    DateTime StartTime,
    DateTime EndTime,
    string Status);
