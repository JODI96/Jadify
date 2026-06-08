using Jadify.API.Shared.Data;
using Jadify.API.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Jadify.API.Shared.Services;

public class SendGridEmailService(
    ISendGridClient client,
    JadifyDbContext db,
    IConfiguration config,
    ILogger<SendGridEmailService> logger) : IEmailService
{
    private readonly string _fromEmail   = config["SendGrid:FromEmail"] ?? "noreply@jadify.ch";
    private readonly string _fromName    = config["SendGrid:FromName"]  ?? "Jadify";
    private readonly string _frontendUrl = config["FrontendUrl"]        ?? "https://app.jadify.ch";

    public async Task SendBookingConfirmationAsync(
        string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Business)
            .Include(b => b.Staff)
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking is null)
        {
            logger.LogWarning("Cannot send confirmation: booking {BookingId} not found", bookingId);
            return;
        }

        var confirmUrl = $"{_frontendUrl}/book/{booking.Business.Slug}/confirmation/{booking.Id}";
        var dateStr    = booking.StartTime.ToString("dddd, d. MMMM yyyy", new System.Globalization.CultureInfo("de-CH"));
        var timeStr    = booking.StartTime.ToString("HH:mm");

        var html = $"""
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <div style="max-width:560px;margin:40px auto;padding:0 16px">

                <!-- Card -->
                <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">

                  <!-- Green header -->
                  <div style="background:#22c55e;padding:40px 32px;text-align:center">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.25);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                      <span style="color:white;font-size:36px;line-height:1">✓</span>
                    </div>
                    <h1 style="color:white;margin:0 0 6px;font-size:24px;font-weight:700">Buchung bestätigt!</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px">Zahlung erfolgreich verarbeitet</p>
                  </div>

                  <!-- Details -->
                  <div style="padding:32px">
                    <p style="margin:0 0 24px;font-size:15px;color:#374151">
                      Hallo <strong>{booking.Customer.Name}</strong>,<br>
                      deine Buchung bei <strong>{booking.Business.Name}</strong> ist bestätigt.
                    </p>

                    <!-- Info rows -->
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:40%">Leistung</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827">{booking.Service.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Mitarbeiter</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{booking.Staff.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Datum</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{dateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Uhrzeit</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{timeStr} Uhr</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;color:#6b7280;font-size:13px">Betrag</td>
                        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#111827">CHF {booking.TotalAmount:F2}</td>
                      </tr>
                    </table>

                    <!-- CTA button -->
                    <div style="text-align:center;margin-top:28px">
                      <a href="{confirmUrl}"
                         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600">
                        Buchung anzeigen
                      </a>
                    </div>

                    <!-- Booking ID -->
                    <p style="text-align:center;margin:20px 0 0;font-size:11px;color:#9ca3af;font-family:monospace">
                      Buchungsnummer: {booking.Id}
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <p style="text-align:center;margin:20px 0;font-size:12px;color:#9ca3af">
                  Diese E-Mail wurde automatisch von Jadify verschickt.<br>
                  Bei Fragen wende dich direkt an {booking.Business.Name}.
                </p>
              </div>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = $"Buchungsbestätigung – {booking.Service.Name} bei {booking.Business.Name}",
        };
        msg.AddTo(new EmailAddress(toEmail, toName));
        msg.AddContent(MimeType.Html, html);

        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
            logger.LogWarning("SendGrid returned {Status} for booking {BookingId}",
                (int)response.StatusCode, bookingId);
        else
            logger.LogInformation("Confirmation email sent to {Email} for booking {BookingId}",
                toEmail, bookingId);
    }

    public async Task SendBookingCancellationAsync(
        string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Business)
            .Include(b => b.Staff)
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking is null)
        {
            logger.LogWarning("Cannot send cancellation: booking {BookingId} not found", bookingId);
            return;
        }

        var dateStr = booking.StartTime.ToString("dddd, d. MMMM yyyy", new System.Globalization.CultureInfo("de-CH"));
        var timeStr = booking.StartTime.ToString("HH:mm");

        var html = $"""
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <div style="max-width:560px;margin:40px auto;padding:0 16px">
                <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                  <div style="background:#ef4444;padding:40px 32px;text-align:center">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.25);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                      <span style="color:white;font-size:36px;line-height:1">✕</span>
                    </div>
                    <h1 style="color:white;margin:0 0 6px;font-size:24px;font-weight:700">Buchung storniert</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px">Deine Buchung wurde erfolgreich storniert</p>
                  </div>
                  <div style="padding:32px">
                    <p style="margin:0 0 24px;font-size:15px;color:#374151">
                      Hallo <strong>{booking.Customer.Name}</strong>,<br>
                      deine Buchung bei <strong>{booking.Business.Name}</strong> wurde storniert.
                    </p>
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:40%">Leistung</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827">{booking.Service.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Mitarbeiter</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{booking.Staff.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Datum</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{dateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;color:#6b7280;font-size:13px">Uhrzeit</td>
                        <td style="padding:12px 0;font-size:14px;color:#374151">{timeStr} Uhr</td>
                      </tr>
                    </table>
                    <div style="margin-top:24px;padding:16px;background:#fef2f2;border-radius:10px">
                      <p style="margin:0;font-size:13px;color:#991b1b">
                        Falls eine Zahlung erfolgt ist, wird die Rückerstattung innerhalb von 5–10 Werktagen auf deiner Karte gutgeschrieben.
                      </p>
                    </div>
                  </div>
                </div>
                <p style="text-align:center;margin:20px 0;font-size:12px;color:#9ca3af">
                  Diese E-Mail wurde automatisch von Jadify verschickt.<br>
                  Bei Fragen wende dich direkt an {booking.Business.Name}.
                </p>
              </div>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = $"Buchung storniert – {booking.Service.Name} bei {booking.Business.Name}",
        };
        msg.AddTo(new EmailAddress(toEmail, toName));
        msg.AddContent(MimeType.Html, html);

        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
            logger.LogWarning("SendGrid returned {Status} for cancellation {BookingId}",
                (int)response.StatusCode, bookingId);
        else
            logger.LogInformation("Cancellation email sent to {Email} for booking {BookingId}",
                toEmail, bookingId);
    }

    public async Task SendOwnerBookingNotificationAsync(
        string ownerEmail, string ownerName, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Business)
            .Include(b => b.Staff)
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking is null)
        {
            logger.LogWarning("Cannot send owner notification: booking {BookingId} not found", bookingId);
            return;
        }

        var dashboardUrl = $"{_frontendUrl}/dashboard/bookings";
        var dateStr      = booking.StartTime.ToString("dddd, d. MMMM yyyy", new System.Globalization.CultureInfo("de-CH"));
        var timeStr      = booking.StartTime.ToString("HH:mm");
        var endTimeStr   = booking.EndTime.ToString("HH:mm");

        var html = $"""
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <div style="max-width:560px;margin:40px auto;padding:0 16px">
                <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                  <div style="background:#111827;padding:40px 32px;text-align:center">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.1);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                      <span style="color:white;font-size:32px;line-height:1">📅</span>
                    </div>
                    <h1 style="color:white;margin:0 0 6px;font-size:24px;font-weight:700">Neue Buchung</h1>
                    <p style="color:rgba(255,255,255,0.6);margin:0;font-size:14px">{booking.Business.Name}</p>
                  </div>
                  <div style="padding:32px">
                    <p style="margin:0 0 24px;font-size:15px;color:#374151">
                      Eine neue Buchung ist eingegangen.
                    </p>
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:40%">Kunde</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827">{booking.Customer.Name}</td>
                      </tr>
                      {(booking.Customer.Phone is not null ? $"""
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Telefon</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{booking.Customer.Phone}</td>
                      </tr>
                      """ : "")}
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Leistung</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{booking.Service.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Mitarbeiter</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{booking.Staff.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Datum</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{dateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Uhrzeit</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{timeStr}–{endTimeStr} Uhr</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;color:#6b7280;font-size:13px">Betrag</td>
                        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#111827">CHF {booking.TotalAmount:F2}</td>
                      </tr>
                    </table>
                    <div style="text-align:center;margin-top:28px">
                      <a href="{dashboardUrl}"
                         style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600">
                        Im Dashboard anzeigen
                      </a>
                    </div>
                  </div>
                </div>
                <p style="text-align:center;margin:20px 0;font-size:12px;color:#9ca3af">
                  Diese Benachrichtigung wurde automatisch von Jadify verschickt.
                </p>
              </div>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = $"Neue Buchung – {booking.Customer.Name} ({booking.Service.Name})",
        };
        msg.AddTo(new EmailAddress(ownerEmail, ownerName));
        msg.AddContent(MimeType.Html, html);

        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
            logger.LogWarning("SendGrid returned {Status} for owner notification booking {BookingId}",
                (int)response.StatusCode, bookingId);
        else
            logger.LogInformation("Owner notification sent to {Email} for booking {BookingId}",
                ownerEmail, bookingId);
    }

    public async Task SendBookingReminderAsync(
        string toEmail, string toName, Guid bookingId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Business)
            .Include(b => b.Staff)
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        if (booking is null)
        {
            logger.LogWarning("Cannot send reminder: booking {BookingId} not found", bookingId);
            return;
        }

        var confirmUrl = $"{_frontendUrl}/book/{booking.Business.Slug}/confirmation/{booking.Id}";
        var dateStr    = booking.StartTime.ToString("dddd, d. MMMM yyyy", new System.Globalization.CultureInfo("de-CH"));
        var timeStr    = booking.StartTime.ToString("HH:mm");
        var endTimeStr = booking.EndTime.ToString("HH:mm");

        var html = $"""
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <div style="max-width:560px;margin:40px auto;padding:0 16px">
                <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                  <div style="background:#4f46e5;padding:40px 32px;text-align:center">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                      <span style="color:white;font-size:32px;line-height:1">⏰</span>
                    </div>
                    <h1 style="color:white;margin:0 0 6px;font-size:24px;font-weight:700">Erinnerung – Morgen</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px">Dein Termin bei {booking.Business.Name}</p>
                  </div>
                  <div style="padding:32px">
                    <p style="margin:0 0 24px;font-size:15px;color:#374151">
                      Hallo <strong>{booking.Customer.Name}</strong>,<br>
                      wir erinnern dich an deinen morgigen Termin.
                    </p>
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:40%">Leistung</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827">{booking.Service.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Mitarbeiter</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{booking.Staff.Name}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Datum</td>
                        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">{dateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;color:#6b7280;font-size:13px">Uhrzeit</td>
                        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#111827">{timeStr}–{endTimeStr} Uhr</td>
                      </tr>
                    </table>
                    <div style="text-align:center;margin-top:28px">
                      <a href="{confirmUrl}"
                         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600">
                        Buchung anzeigen
                      </a>
                    </div>
                  </div>
                </div>
                <p style="text-align:center;margin:20px 0;font-size:12px;color:#9ca3af">
                  Diese E-Mail wurde automatisch von Jadify verschickt.<br>
                  Bei Fragen wende dich direkt an {booking.Business.Name}.
                </p>
              </div>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = $"Erinnerung: {booking.Service.Name} morgen um {timeStr} Uhr",
        };
        msg.AddTo(new EmailAddress(toEmail, toName));
        msg.AddContent(MimeType.Html, html);

        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
            logger.LogWarning("SendGrid returned {Status} for reminder booking {BookingId}",
                (int)response.StatusCode, bookingId);
        else
            logger.LogInformation("Reminder email sent to {Email} for booking {BookingId}",
                toEmail, bookingId);
    }

    public async Task SendPasswordResetAsync(string toEmail, string resetUrl, CancellationToken ct = default)
    {
        var html = $"""
            <!DOCTYPE html>
            <html lang="de">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <div style="max-width:520px;margin:40px auto;padding:0 16px">
                <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                  <div style="background:#4f46e5;padding:36px 32px;text-align:center">
                    <h1 style="color:white;margin:0 0 6px;font-size:22px;font-weight:700">Passwort zurücksetzen</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px">Jadify</p>
                  </div>
                  <div style="padding:32px">
                    <p style="margin:0 0 16px;font-size:15px;color:#374151">
                      Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten.
                      Klicke auf den Button, um ein neues Passwort festzulegen.
                    </p>
                    <div style="text-align:center;margin:28px 0">
                      <a href="{resetUrl}"
                         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600">
                        Passwort zurücksetzen
                      </a>
                    </div>
                    <p style="margin:0;font-size:13px;color:#6b7280">
                      Dieser Link ist 24 Stunden gültig. Falls du diese Anfrage nicht gestellt hast,
                      kannst du diese E-Mail ignorieren.
                    </p>
                  </div>
                </div>
                <p style="text-align:center;margin:20px 0;font-size:12px;color:#9ca3af">
                  Diese E-Mail wurde von Jadify gesendet.
                </p>
              </div>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = "Passwort zurücksetzen – Jadify",
        };
        msg.AddTo(new EmailAddress(toEmail));
        msg.AddContent(MimeType.Html, html);

        var response = await client.SendEmailAsync(msg, ct);
        if (!response.IsSuccessStatusCode)
            logger.LogWarning("SendGrid returned {Status} for password reset to {Email}",
                (int)response.StatusCode, toEmail);
    }

    public async Task SendWelcomeAsync(string toEmail, string toName, CancellationToken ct = default)
    {
        var msg = new SendGridMessage
        {
            From    = new EmailAddress(_fromEmail, _fromName),
            Subject = "Willkommen bei Jadify!",
        };
        msg.AddTo(new EmailAddress(toEmail, toName));
        msg.AddContent(MimeType.Text,
            $"Hallo {toName}, willkommen bei Jadify! Dein Konto ist bereit. " +
            "Melde dich an und richte dein Unternehmen ein.");

        await client.SendEmailAsync(msg, ct);
    }
}
