using Jadify.API.Shared.Constants;
using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Interfaces;
using Jadify.API.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Customer = Jadify.API.Shared.Models.Customer;

namespace Jadify.API.Features.Bookings;

public class BookingService(
    JadifyDbContext db,
    IStripeClient stripeClient,
    IHostEnvironment env,
    ILogger<BookingService> logger) : IBookingService
{
    public async Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
        CreatePaymentIntentRequest request, CancellationToken ct = default)
    {
        var service = await db.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.BusinessId == request.BusinessId && s.IsActive, ct)
            ?? throw new KeyNotFoundException($"Service {request.ServiceId} not found");

        var endTime = request.StartTime.AddMinutes(service.DurationMinutes);

        // Verify the slot is still free (read-only check, no lock)
        if (request.StaffId.HasValue)
        {
            var conflict = await db.Bookings.AnyAsync(b =>
                b.StaffId == request.StaffId
             && b.Status  != BookingStatus.Cancelled
             && b.StartTime < endTime
             && b.EndTime   > request.StartTime, ct);
            if (conflict)
                throw new InvalidOperationException("This time slot is no longer available");
        }

        var subscription = await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.BusinessId == request.BusinessId, ct);

        var feePercent = (subscription?.Tier ?? SubscriptionTier.Free) switch
        {
            SubscriptionTier.Growth => JadifyConstants.Tiers.GrowthFeePercent,
            SubscriptionTier.Pro    => JadifyConstants.Tiers.ProFeePercent,
            _                       => JadifyConstants.Tiers.FreeFeePercent
        };
        var feeAmount = Math.Round(service.Price * feePercent, 2);

        var piOptions = new PaymentIntentCreateOptions
        {
            Amount   = ToStripeAmount(service.Price),
            Currency = "chf",
            Metadata = new Dictionary<string, string>
            {
                ["business_id"] = request.BusinessId.ToString(),
                ["service_id"]  = request.ServiceId.ToString(),
            }
        };

        if (env.IsProduction() && feeAmount > 0)
            piOptions.ApplicationFeeAmount = ToStripeAmount(feeAmount);

        var piService = new PaymentIntentService(stripeClient);
        var intent = await piService.CreateAsync(piOptions, cancellationToken: ct);

        return new CreatePaymentIntentResponse(intent.ClientSecret, service.Price);
    }

    public async Task<BookingResponse> CreateAsync(
        CreateBookingRequest request, CancellationToken ct = default)
    {
        // 1. Load required entities
        var service = await db.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.BusinessId == request.BusinessId && s.IsActive, ct)
            ?? throw new KeyNotFoundException($"Service {request.ServiceId} not found");

        var business = await db.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BusinessId && b.IsActive, ct)
            ?? throw new KeyNotFoundException($"Business {request.BusinessId} not found");

        var endTime = request.StartTime.AddMinutes(service.DurationMinutes);

        // 2. Guard against concurrent double-booking (check overlap inside transaction)
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        Jadify.API.Shared.Models.Staff staff;
        if (request.StaffId.HasValue)
        {
            staff = await db.Staff
                .FirstOrDefaultAsync(s => s.Id == request.StaffId && s.BusinessId == request.BusinessId && s.IsActive, ct)
                ?? throw new KeyNotFoundException($"Staff member {request.StaffId} not found");

            var conflict = await db.Bookings.AnyAsync(b =>
                b.StaffId == request.StaffId
             && b.Status  != BookingStatus.Cancelled
             && b.StartTime < endTime
             && b.EndTime   > request.StartTime, ct);

            if (conflict)
                throw new InvalidOperationException("This time slot is no longer available");
        }
        else
        {
            // Pick any active staff member not booked at this time
            var busyStaffIds = await db.Bookings
                .Where(b => b.BusinessId == request.BusinessId
                         && b.Status != BookingStatus.Cancelled
                         && b.StartTime < endTime
                         && b.EndTime   > request.StartTime)
                .Select(b => b.StaffId)
                .ToListAsync(ct);

            staff = await db.Staff
                .FirstOrDefaultAsync(s => s.BusinessId == request.BusinessId
                                       && s.IsActive
                                       && !busyStaffIds.Contains(s.Id), ct)
                ?? throw new InvalidOperationException("No available staff for the requested time slot");
        }

        // 3. Find or create customer (keyed by email)
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Email == request.CustomerEmail, ct);
        if (customer is null)
        {
            customer = new Customer
            {
                Name  = request.CustomerName,
                Email = request.CustomerEmail,
                Phone = request.CustomerPhone
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync(ct);
        }

        // 4. Calculate platform fee based on the business subscription tier
        var subscription = await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.BusinessId == request.BusinessId, ct);

        var feePercent = (subscription?.Tier ?? SubscriptionTier.Free) switch
        {
            SubscriptionTier.Growth => JadifyConstants.Tiers.GrowthFeePercent,
            SubscriptionTier.Pro    => JadifyConstants.Tiers.ProFeePercent,
            _                       => JadifyConstants.Tiers.FreeFeePercent
        };
        var feeAmount = Math.Round(service.Price * feePercent, 2);

        // 5. Persist the booking — Confirmed if payment already done, otherwise Pending
        var isPrepaid = request.PaymentIntentId is not null;
        var booking = new Booking
        {
            BusinessId             = request.BusinessId,
            StaffId                = staff.Id,
            ServiceId              = request.ServiceId,
            CustomerId             = customer.Id,
            StartTime              = request.StartTime,
            EndTime                = endTime,
            Status                 = isPrepaid ? BookingStatus.Confirmed : BookingStatus.Pending,
            TotalAmount            = service.Price,
            FeeAmount              = feeAmount,
            Notes                  = request.Notes,
            StripePaymentIntentId  = request.PaymentIntentId
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        logger.LogInformation("Booking {BookingId} created (prepaid={Prepaid})", booking.Id, isPrepaid);

        return ToResponse(booking, business.Name, staff.Name, service.Name,
            customer.Name, customer.Email, null);
    }

    public async Task<BookingResponse> ConfirmAsync(Guid bookingId, CancellationToken ct = default)
    {
        var booking = await LoadBookingWithRelationsAsync(bookingId, ct);

        if (booking.Status == BookingStatus.Confirmed)
            return ToResponse(booking, clientSecret: null);

        if (booking.Status != BookingStatus.Pending)
            throw new InvalidOperationException($"Cannot confirm a booking with status '{booking.Status}'");

        booking.Status = BookingStatus.Confirmed;
        await db.SaveChangesAsync(ct);

        return ToResponse(booking, clientSecret: null);
    }

    public async Task<BookingResponse> CancelAsync(Guid bookingId, string? reason, CancellationToken ct = default)
    {
        var booking = await LoadBookingWithRelationsAsync(bookingId, ct);

        if (booking.Status == BookingStatus.Cancelled)
            return ToResponse(booking, clientSecret: null);

        // Cancel or refund through Stripe depending on current payment state
        if (booking.StripePaymentIntentId is not null)
        {
            var piService = new PaymentIntentService(stripeClient);

            if (booking.Status == BookingStatus.Pending)
            {
                // Payment not yet captured — cancel the intent to release the authorisation
                await piService.CancelAsync(booking.StripePaymentIntentId, cancellationToken: ct);
            }
            else if (booking.Status == BookingStatus.Confirmed)
            {
                // Payment was captured — issue a full refund via the latest charge
                var intent = await piService.GetAsync(booking.StripePaymentIntentId, cancellationToken: ct);
                if (intent.LatestChargeId is not null)
                {
                    var refundService = new RefundService(stripeClient);
                    await refundService.CreateAsync(
                        new RefundCreateOptions { Charge = intent.LatestChargeId },
                        cancellationToken: ct);
                }
            }
        }

        booking.Status = BookingStatus.Cancelled;
        if (reason is not null) booking.Notes = reason;
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Booking {BookingId} cancelled", bookingId);
        return ToResponse(booking, clientSecret: null);
    }

    public async Task<BookingResponse?> GetByIdAsync(Guid bookingId, CancellationToken ct = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Business)
            .Include(b => b.Staff)
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct);

        return booking is null ? null : ToResponse(booking, clientSecret: null);
    }

    public async Task<IReadOnlyList<BookingSummaryDto>> GetForBusinessAsync(
        Guid businessId, DateOnly? date, BookingStatus? status, CancellationToken ct = default)
    {
        var query = db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .Include(b => b.Staff)
            .AsNoTracking()
            .Where(b => b.BusinessId == businessId);

        if (date.HasValue)
        {
            var dayStart = date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dayEnd   = dayStart.AddDays(1);
            query = query.Where(b => b.StartTime >= dayStart && b.StartTime < dayEnd);
        }

        if (status.HasValue)
            query = query.Where(b => b.Status == status.Value);

        var bookings = await query
            .OrderBy(b => b.StartTime)
            .ToListAsync(ct);

        return bookings.Select(b => new BookingSummaryDto(
            b.Id,
            b.Customer.Name,
            b.Customer.Email,
            b.Service.Name,
            b.Staff.Name,
            b.StartTime,
            b.EndTime,
            b.Status.ToString(),
            b.TotalAmount
        )).ToList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Booking> LoadBookingWithRelationsAsync(Guid bookingId, CancellationToken ct)
        => await db.Bookings
            .Include(b => b.Business)
            .Include(b => b.Staff)
            .Include(b => b.Service)
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found");

    private static BookingResponse ToResponse(
        Booking b, string? clientSecret)
        => ToResponse(b, b.Business.Name, b.Staff.Name, b.Service.Name,
            b.Customer.Name, b.Customer.Email, clientSecret);

    private static BookingResponse ToResponse(
        Booking b,
        string businessName, string staffName, string serviceName,
        string customerName, string customerEmail,
        string? clientSecret)
        => new(
            b.Id, businessName, staffName, serviceName,
            customerName, customerEmail,
            b.StartTime, b.EndTime,
            b.Status.ToString(),
            b.TotalAmount, b.FeeAmount,
            clientSecret,
            b.Notes, b.CreatedAt);

    // Stripe amounts are always in the smallest currency unit (Rappen for CHF)
    private static long ToStripeAmount(decimal chf) => (long)(chf * 100);
}
