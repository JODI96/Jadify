using Jadify.API.Shared.Data;
using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Services;

[ApiController]
[Authorize]
public class ServiceController(JadifyDbContext db) : ControllerBase
{
    [HttpGet("api/businesses/{businessId:guid}/services")]
    public async Task<ActionResult<IReadOnlyList<ServiceResponse>>> List(
        Guid businessId, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var services = await db.Services
            .Where(s => s.BusinessId == businessId)
            .OrderBy(s => s.Name)
            .AsNoTracking()
            .ToListAsync(ct);

        return Ok(services.Select(ToResponse).ToList());
    }

    [HttpPost("api/businesses/{businessId:guid}/services")]
    public async Task<ActionResult<ServiceResponse>> Create(
        Guid businessId, CreateServiceRequest request, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var service = new Service
        {
            BusinessId      = businessId,
            Name            = request.Name,
            Description     = request.Description,
            DurationMinutes = request.DurationMinutes,
            Price           = request.Price
        };

        db.Services.Add(service);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(List), new { businessId }, ToResponse(service));
    }

    [HttpPut("api/services/{id:guid}")]
    public async Task<ActionResult<ServiceResponse>> Update(
        Guid id, UpdateServiceRequest request, CancellationToken ct)
    {
        var service = await db.Services.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Service {id} not found");

        await VerifyOwnershipAsync(service.BusinessId, ct);

        service.Name            = request.Name;
        service.Description     = request.Description;
        service.DurationMinutes = request.DurationMinutes;
        service.Price           = request.Price;
        service.IsActive        = request.IsActive;

        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(service));
    }

    [HttpDelete("api/services/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var service = await db.Services.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Service {id} not found");

        await VerifyOwnershipAsync(service.BusinessId, ct);

        service.IsActive = false;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task VerifyOwnershipAsync(Guid businessId, CancellationToken ct)
    {
        var ownerId = User.GetUserId()!;
        var owned = await db.Businesses
            .AnyAsync(b => b.Id == businessId && b.OwnerId == ownerId, ct);
        if (!owned)
            throw new UnauthorizedAccessException("You do not own this business");
    }

    private static ServiceResponse ToResponse(Service s) =>
        new(s.Id, s.Name, s.Description, s.DurationMinutes, s.Price, s.IsActive, s.CreatedAt);
}
