using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Features.Dashboard;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    /// <summary>Returns KPI metrics and today's schedule for the authenticated owner's business.</summary>
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get(CancellationToken ct)
    {
        var businessId = User.GetBusinessId()
            ?? throw new UnauthorizedAccessException("business_id claim missing from token");

        return Ok(await dashboardService.GetAsync(businessId, ct));
    }
}
