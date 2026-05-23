using Jadify.API.Shared.Data;
using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Staff;

[ApiController]
[Authorize]
public class StaffController(JadifyDbContext db) : ControllerBase
{
    [HttpGet("api/businesses/{businessId:guid}/staff")]
    public async Task<ActionResult<IReadOnlyList<StaffResponse>>> List(
        Guid businessId, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var staff = await db.Staff
            .Where(s => s.BusinessId == businessId)
            .OrderBy(s => s.Name)
            .AsNoTracking()
            .ToListAsync(ct);

        return Ok(staff.Select(ToResponse).ToList());
    }

    [HttpPost("api/businesses/{businessId:guid}/staff")]
    public async Task<ActionResult<StaffResponse>> Create(
        Guid businessId, CreateStaffRequest request, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var member = new Jadify.API.Shared.Models.Staff
        {
            BusinessId = businessId,
            Name       = request.Name,
            Email      = request.Email
        };

        db.Staff.Add(member);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(List), new { businessId }, ToResponse(member));
    }

    [HttpPut("api/staff/{id:guid}")]
    public async Task<ActionResult<StaffResponse>> Update(
        Guid id, UpdateStaffRequest request, CancellationToken ct)
    {
        var member = await db.Staff.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Staff member {id} not found");

        await VerifyOwnershipAsync(member.BusinessId, ct);

        member.Name     = request.Name;
        member.Email    = request.Email;
        member.IsActive = request.IsActive;

        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(member));
    }

    [HttpDelete("api/staff/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var member = await db.Staff.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Staff member {id} not found");

        await VerifyOwnershipAsync(member.BusinessId, ct);

        member.IsActive = false;
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

    private static StaffResponse ToResponse(Jadify.API.Shared.Models.Staff s) =>
        new(s.Id, s.Name, s.Email, s.AvatarUrl, s.IsActive, s.CreatedAt);
}
