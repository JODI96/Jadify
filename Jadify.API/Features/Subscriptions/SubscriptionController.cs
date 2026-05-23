using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Features.Subscriptions;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionController(ISubscriptionService subscriptionService) : ControllerBase
{
    /// <summary>Returns the current subscription plan for a business.</summary>
    [HttpGet("{businessId:guid}")]
    public async Task<ActionResult<SubscriptionResponse>> Get(
        Guid businessId, CancellationToken ct)
    {
        var result = await subscriptionService.GetForBusinessAsync(businessId, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Creates a Stripe Customer + Subscription for the authenticated owner's business.</summary>
    [HttpPost("create")]
    public async Task<ActionResult<SubscriptionResponse>> Create(
        CreateSubscriptionRequest request, CancellationToken ct)
    {
        var businessId = User.GetBusinessId()
            ?? throw new UnauthorizedAccessException("business_id claim missing from token");

        return Ok(await subscriptionService.CreateAsync(businessId, request.Tier, ct));
    }

    /// <summary>Upgrades or downgrades the subscription tier. Prorations are applied immediately.</summary>
    [HttpPut("upgrade")]
    public async Task<ActionResult<SubscriptionResponse>> ChangeTier(
        ChangeTierRequest request, CancellationToken ct)
    {
        var businessId = User.GetBusinessId()
            ?? throw new UnauthorizedAccessException("business_id claim missing from token");

        return Ok(await subscriptionService.ChangeTierAsync(businessId, request.NewTier, ct));
    }

    /// <summary>Sets the subscription to cancel at the end of the current billing period.</summary>
    [HttpDelete("cancel")]
    public async Task<IActionResult> Cancel(CancellationToken ct)
    {
        var businessId = User.GetBusinessId()
            ?? throw new UnauthorizedAccessException("business_id claim missing from token");

        await subscriptionService.CancelAsync(businessId, ct);
        return NoContent();
    }
}
