using Jadify.API.Shared.Interfaces;

namespace Jadify.API.Shared.Services;

public class NullEmailService : IEmailService
{
    public Task SendWelcomeAsync(string toEmail, string toName, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task SendBookingConfirmationAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task SendBookingCancellationAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task SendOwnerBookingNotificationAsync(string ownerEmail, string ownerName, Guid bookingId, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task SendBookingReminderAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task SendPasswordResetAsync(string toEmail, string resetUrl, CancellationToken ct = default)
        => Task.CompletedTask;
}
