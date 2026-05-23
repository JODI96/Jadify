using Jadify.API.Shared.Interfaces;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Jadify.API.Shared.Services;

public class SendGridEmailService(
    ISendGridClient client,
    IConfiguration config,
    ILogger<SendGridEmailService> logger) : IEmailService
{
    private readonly string _fromEmail = config["SendGrid:FromEmail"] ?? "noreply@jadify.ch";
    private readonly string _fromName  = config["SendGrid:FromName"]  ?? "Jadify";

    public async Task SendBookingConfirmationAsync(
        string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
    {
        var msg = BuildMessage(
            toEmail, toName,
            subject: "Booking Confirmed — Jadify",
            text: $"Your booking (ref: {bookingId:N}) has been confirmed. Thank you for choosing Jadify.");

        await SendAsync(msg, bookingId.ToString(), ct);
    }

    public async Task SendBookingCancellationAsync(
        string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
    {
        var msg = BuildMessage(
            toEmail, toName,
            subject: "Booking Cancelled — Jadify",
            text: $"Your booking (ref: {bookingId:N}) has been cancelled.");

        await SendAsync(msg, bookingId.ToString(), ct);
    }

    public async Task SendWelcomeAsync(
        string toEmail, string toName, CancellationToken ct = default)
    {
        var msg = BuildMessage(
            toEmail, toName,
            subject: "Welcome to Jadify!",
            text: $"Hi {toName}, welcome to Jadify! Your account is ready. " +
                  "Log in to configure your business and start accepting bookings.");

        await SendAsync(msg, toEmail, ct);
    }

    // -------------------------------------------------------------------------

    private SendGridMessage BuildMessage(string toEmail, string toName, string subject, string text)
    {
        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = subject
        };
        msg.AddTo(new EmailAddress(toEmail, toName));
        msg.AddContent(MimeType.Text, text);
        return msg;
    }

    private async Task SendAsync(SendGridMessage msg, string reference, CancellationToken ct)
    {
        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
            logger.LogWarning("SendGrid returned {Status} for message ref={Ref}",
                (int)response.StatusCode, reference);
    }
}
