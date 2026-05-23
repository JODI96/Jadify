namespace Jadify.API.Shared.Interfaces;

public interface IEmailService
{
    Task SendBookingConfirmationAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default);
    Task SendBookingCancellationAsync(string toEmail, string toName, Guid bookingId, CancellationToken ct = default);
    Task SendWelcomeAsync(string toEmail, string toName, CancellationToken ct = default);
}
