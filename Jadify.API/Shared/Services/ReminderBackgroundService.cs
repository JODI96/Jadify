using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Shared.Services;

public class ReminderBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<ReminderBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval   = TimeSpan.FromMinutes(15);
    // Outer DB window: fetch any confirmed booking within 1–169 h, then filter per business setting
    private static readonly TimeSpan OuterMin   = TimeSpan.FromHours(1);
    private static readonly TimeSpan OuterMax   = TimeSpan.FromHours(169);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Reminder background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendPendingRemindersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Reminder sweep failed");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task SendPendingRemindersAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        await using var scope        = scopeFactory.CreateAsyncScope();
        var db           = scope.ServiceProvider.GetRequiredService<JadifyDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var bookings = await db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Business)
            .Where(b =>
                b.Status         == BookingStatus.Confirmed &&
                b.ReminderSentAt == null &&
                b.StartTime      >= now + OuterMin &&
                b.StartTime      <= now + OuterMax)
            .ToListAsync(ct);

        // Apply per-business setting: only send if we're within the configured window
        bookings = bookings
            .Where(b => b.StartTime <= now + TimeSpan.FromHours(b.Business.ReminderHoursBefore))
            .ToList();

        if (bookings.Count == 0) return;

        logger.LogInformation("Sending reminders for {Count} bookings", bookings.Count);

        foreach (var booking in bookings)
        {
            try
            {
                await emailService.SendBookingReminderAsync(
                    booking.Customer.Email,
                    booking.Customer.Name,
                    booking.Id,
                    ct);

                booking.ReminderSentAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Reminder failed for booking {BookingId}", booking.Id);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
