using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Features.Payments;

[ApiController]
[Route("api/payments")]
public class PaymentController(IPaymentService paymentService) : ControllerBase
{
    /// <summary>
    /// Returns a Stripe PaymentIntent client_secret for an existing booking.
    /// Reuses the existing intent if still actionable; creates a new one otherwise.
    /// The frontend uses the client_secret with Stripe Elements to collect payment.
    /// </summary>
    [HttpPost("create-intent")]
    [AllowAnonymous]
    public async Task<ActionResult<CreatePaymentIntentResponse>> CreateIntent(
        CreatePaymentIntentRequest request, CancellationToken ct)
        => Ok(await paymentService.CreatePaymentIntentAsync(request.BookingId, ct));
}
