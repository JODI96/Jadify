namespace Jadify.API.Shared.Interfaces;

public interface IEmailService
{
    Task SendBookingConfirmationAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default);
    Task SendBookingCancellationAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default);
    Task SendOwnerBookingNotificationAsync(string ownerEmail, string ownerName, Guid bookingId, CancellationToken ct = default);
    Task SendBookingReminderAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default);
    Task SendWelcomeAsync(string toEmail, string toName, CancellationToken ct = default);
    Task SendPasswordResetAsync(string toEmail, string resetUrl, CancellationToken ct = default);
}
