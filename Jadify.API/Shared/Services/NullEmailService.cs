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
}
