using Jadify.API.Shared.Data;
using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Tables;

[ApiController]
[Authorize]
public class TableController(JadifyDbContext db) : ControllerBase
{
    [HttpGet("api/businesses/{businessId:guid}/tables")]
    public async Task<ActionResult<IReadOnlyList<TableResponse>>> List(
        Guid businessId, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var tables = await db.Tables
            .Where(t => t.BusinessId == businessId)
            .OrderBy(t => t.Name)
            .AsNoTracking()
            .ToListAsync(ct);

        return Ok(tables.Select(ToResponse).ToList());
    }

    [HttpPost("api/businesses/{businessId:guid}/tables")]
    public async Task<ActionResult<TableResponse>> Create(
        Guid businessId, CreateTableRequest request, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var table = new Table
        {
            BusinessId = businessId,
            Name       = request.Name,
            Capacity   = request.Capacity
        };

        db.Tables.Add(table);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(List), new { businessId }, ToResponse(table));
    }

    [HttpPut("api/tables/{id:guid}")]
    public async Task<ActionResult<TableResponse>> Update(
        Guid id, UpdateTableRequest request, CancellationToken ct)
    {
        var table = await db.Tables.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Table {id} not found");

        await VerifyOwnershipAsync(table.BusinessId, ct);

        table.Name     = request.Name;
        table.Capacity = request.Capacity;
        table.IsActive = request.IsActive;

        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(table));
    }

    [HttpDelete("api/tables/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var table = await db.Tables.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Table {id} not found");

        await VerifyOwnershipAsync(table.BusinessId, ct);

        table.IsActive = false;
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

    private static TableResponse ToResponse(Table t) =>
        new(t.Id, t.Name, t.Capacity, t.IsActive, t.CreatedAt);
}
