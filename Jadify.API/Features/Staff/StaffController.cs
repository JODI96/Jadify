using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Jadify.API.Shared.Data;
using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Staff;

[ApiController]
[Authorize]
public class StaffController(JadifyDbContext db, IServiceProvider services, IConfiguration config) : ControllerBase
{
    private readonly BlobServiceClient? _blobClient = services.GetService<BlobServiceClient>();
    private readonly string _containerName = config["Azure:BlobContainerName"] ?? "jadify-logos";

    [HttpGet("api/businesses/{businessId:guid}/staff")]
    public async Task<ActionResult<IReadOnlyList<StaffResponse>>> List(
        Guid businessId, CancellationToken ct)
    {
        await VerifyOwnershipAsync(businessId, ct);

        var staff = await db.Staff
            .Include(s => s.StaffServices)
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
            Email      = request.Email,
            AvatarUrl  = request.AvatarUrl,
        };
        db.Staff.Add(member);
        await db.SaveChangesAsync(ct);

        // Assign services: use provided list or default to all active services of the business
        var serviceIds = request.ServiceIds is { Count: > 0 }
            ? request.ServiceIds
            : await db.Services
                .Where(s => s.BusinessId == businessId && s.IsActive)
                .Select(s => s.Id)
                .ToListAsync(ct);

        foreach (var sid in serviceIds)
            db.Set<StaffService>().Add(new StaffService { StaffId = member.Id, ServiceId = sid });

        await db.SaveChangesAsync(ct);

        member.StaffServices = db.Set<StaffService>().Local
            .Where(ss => ss.StaffId == member.Id).ToList();

        return CreatedAtAction(nameof(List), new { businessId }, ToResponse(member));
    }

    [HttpPut("api/staff/{id:guid}")]
    public async Task<ActionResult<StaffResponse>> Update(
        Guid id, UpdateStaffRequest request, CancellationToken ct)
    {
        var member = await db.Staff
            .Include(s => s.StaffServices)
            .FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new KeyNotFoundException($"Staff member {id} not found");

        await VerifyOwnershipAsync(member.BusinessId, ct);

        member.Name      = request.Name;
        member.Email     = request.Email;
        member.IsActive  = request.IsActive;
        member.AvatarUrl = request.AvatarUrl;

        if (request.ServiceIds is not null)
        {
            db.Set<StaffService>().RemoveRange(member.StaffServices);
            foreach (var sid in request.ServiceIds)
                db.Set<StaffService>().Add(new StaffService { StaffId = id, ServiceId = sid });
        }

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

    [HttpGet("api/staff/{id:guid}/hours")]
    public async Task<ActionResult<IReadOnlyList<StaffHoursDto>>> GetHours(Guid id, CancellationToken ct)
    {
        var member = await db.Staff.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Staff member {id} not found");
        await VerifyOwnershipAsync(member.BusinessId, ct);

        var hours = await db.StaffHours
            .Where(h => h.StaffId == id)
            .OrderBy(h => h.DayOfWeek)
            .AsNoTracking()
            .ToListAsync(ct);

        return Ok(hours.Select(h => new StaffHoursDto(
            h.DayOfWeek,
            h.StartTime.ToString("HH:mm"),
            h.EndTime.ToString("HH:mm"),
            h.IsWorking)).ToList());
    }

    [HttpPost("api/staff/{id:guid}/hours")]
    public async Task<ActionResult<IReadOnlyList<StaffHoursDto>>> SetHours(
        Guid id, SetStaffHoursRequest request, CancellationToken ct)
    {
        var member = await db.Staff.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Staff member {id} not found");
        await VerifyOwnershipAsync(member.BusinessId, ct);

        var existing = await db.StaffHours.Where(h => h.StaffId == id).ToListAsync(ct);
        db.StaffHours.RemoveRange(existing);

        var newHours = request.Hours.Select(h => new Jadify.API.Shared.Models.StaffHours
        {
            StaffId   = id,
            DayOfWeek = h.DayOfWeek,
            StartTime = TimeOnly.Parse(h.StartTime),
            EndTime   = TimeOnly.Parse(h.EndTime),
            IsWorking = h.IsWorking,
        }).ToList();

        db.StaffHours.AddRange(newHours);
        await db.SaveChangesAsync(ct);

        return Ok(newHours.Select(h => new StaffHoursDto(
            h.DayOfWeek, h.StartTime.ToString("HH:mm"), h.EndTime.ToString("HH:mm"), h.IsWorking)).ToList());
    }

    [HttpPost("api/staff/{id:guid}/photo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<string>> UploadPhoto(Guid id, IFormFile file, CancellationToken ct)
    {
        if (_blobClient is null)
            return StatusCode(501, "Azure Blob Storage is not configured");

        var member = await db.Staff.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Staff member {id} not found");

        await VerifyOwnershipAsync(member.BusinessId, ct);

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest($"Unsupported file type '{ext}'");

        var blobName  = $"staff/{member.Id}{ext}";
        var container = _blobClient.GetBlobContainerClient(_containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);

        var blob = container.GetBlobClient(blobName);
        await using var stream = file.OpenReadStream();
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType }, cancellationToken: ct);

        member.AvatarUrl = blob.Uri.ToString();
        await db.SaveChangesAsync(ct);
        return Ok(member.AvatarUrl);
    }

    // ── Staff blocks ──────────────────────────────────────────────────────────

    [HttpGet("api/staff/{staffId:guid}/blocks")]
    public async Task<ActionResult<IReadOnlyList<StaffBlockResponse>>> ListBlocks(
        Guid staffId, CancellationToken ct)
    {
        var member = await db.Staff.FindAsync([staffId], ct)
            ?? throw new KeyNotFoundException($"Staff member {staffId} not found");
        await VerifyOwnershipAsync(member.BusinessId, ct);

        var blocks = await db.StaffBlocks
            .Where(b => b.StaffId == staffId)
            .OrderBy(b => b.StartDate)
            .AsNoTracking()
            .ToListAsync(ct);

        return Ok(blocks.Select(b => new StaffBlockResponse(b.Id, b.StartDate, b.EndDate, b.Reason, b.CreatedAt)).ToList());
    }

    [HttpPost("api/staff/{staffId:guid}/blocks")]
    public async Task<ActionResult<StaffBlockResponse>> CreateBlock(
        Guid staffId, CreateStaffBlockRequest request, CancellationToken ct)
    {
        var member = await db.Staff.FindAsync([staffId], ct)
            ?? throw new KeyNotFoundException($"Staff member {staffId} not found");
        await VerifyOwnershipAsync(member.BusinessId, ct);

        if (request.EndDate < request.StartDate)
            return BadRequest("EndDate must be >= StartDate");

        var block = new Jadify.API.Shared.Models.StaffBlock
        {
            StaffId   = staffId,
            StartDate = request.StartDate,
            EndDate   = request.EndDate,
            Reason    = request.Reason,
        };
        db.StaffBlocks.Add(block);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(ListBlocks), new { staffId },
            new StaffBlockResponse(block.Id, block.StartDate, block.EndDate, block.Reason, block.CreatedAt));
    }

    [HttpDelete("api/staff/blocks/{id:guid}")]
    public async Task<IActionResult> DeleteBlock(Guid id, CancellationToken ct)
    {
        var block = await db.StaffBlocks.Include(b => b.Staff).FirstOrDefaultAsync(b => b.Id == id, ct)
            ?? throw new KeyNotFoundException($"Block {id} not found");
        await VerifyOwnershipAsync(block.Staff.BusinessId, ct);

        db.StaffBlocks.Remove(block);
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
        new(s.Id, s.Name, s.Email, s.AvatarUrl, s.IsActive, s.CreatedAt,
            s.StaffServices.Select(ss => ss.ServiceId).ToList());
}
