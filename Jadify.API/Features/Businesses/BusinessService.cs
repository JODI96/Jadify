using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Jadify.API.Shared.Data;
using Jadify.API.Shared.Interfaces;
using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Features.Businesses;

public class BusinessService(
    JadifyDbContext db,
    IServiceProvider services,
    IConfiguration config,
    ILogger<BusinessService> logger) : IBusinessService
{
    private readonly BlobServiceClient? _blobClient = services.GetService<BlobServiceClient>();
    private readonly string _containerName = config["Azure:BlobContainerName"] ?? "jadify-logos";

    public async Task<BusinessPublicResponse> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var business = await db.Businesses
            .Include(b => b.BusinessHours)
            .Include(b => b.Staff.Where(s => s.IsActive))
                .ThenInclude(s => s.StaffServices)
            .Include(b => b.Services.Where(s => s.IsActive))
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Slug == slug && b.IsActive, ct)
            ?? throw new KeyNotFoundException($"Business '{slug}' not found");

        return ToPublicResponse(business);
    }

    public async Task<BusinessPublicResponse> UpdateAsync(
        Guid id, string ownerId, UpdateBusinessRequest request, CancellationToken ct = default)
    {
        var business = await GetOwnedAsync(id, ownerId, ct);

        business.Name    = request.Name;
        business.Type    = request.Type;
        business.Address = request.Address;
        business.Phone   = request.Phone;
        business.Email   = request.Email;

        await db.SaveChangesAsync(ct);

        await db.Entry(business).Collection(b => b.BusinessHours).LoadAsync(ct);
        await db.Entry(business).Collection(b => b.Staff).Query()
            .Include(s => s.StaffServices)
            .Where(s => s.IsActive).LoadAsync(ct);
        await db.Entry(business).Collection(b => b.Services).Query()
            .Where(s => s.IsActive).LoadAsync(ct);

        return ToPublicResponse(business);
    }

    public async Task<string> UploadLogoAsync(
        Guid id, string ownerId, IFormFile file, CancellationToken ct = default)
    {
        if (_blobClient is null)
            throw new InvalidOperationException("Azure Blob Storage is not configured");

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            throw new ArgumentException($"Unsupported file type '{ext}'. Allowed: {string.Join(", ", allowed)}");

        var business = await GetOwnedAsync(id, ownerId, ct);

        var blobName = $"logos/{business.Id}{ext}";
        var container = _blobClient.GetBlobContainerClient(_containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);

        var blob = container.GetBlobClient(blobName);
        await using var stream = file.OpenReadStream();
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType }, cancellationToken: ct);

        business.LogoUrl = blob.Uri.ToString();
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Logo uploaded for business {BusinessId}: {Url}", id, business.LogoUrl);
        return business.LogoUrl;
    }

    public async Task<IReadOnlyList<BusinessHoursDto>> SetHoursAsync(
        Guid id, string ownerId, SetBusinessHoursRequest request, CancellationToken ct = default)
    {
        var business = await GetOwnedAsync(id, ownerId, ct);

        var existing = await db.BusinessHours
            .Where(h => h.BusinessId == id)
            .ToListAsync(ct);

        db.BusinessHours.RemoveRange(existing);

        var newHours = request.Hours.Select(h => new BusinessHours
        {
            BusinessId = business.Id,
            DayOfWeek  = h.DayOfWeek,
            OpenTime   = h.OpenTime,
            CloseTime  = h.CloseTime,
            IsClosed   = h.IsClosed
        }).ToList();

        db.BusinessHours.AddRange(newHours);
        await db.SaveChangesAsync(ct);

        return newHours.Select(ToHoursDto).ToList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Business> GetOwnedAsync(Guid id, string ownerId, CancellationToken ct)
    {
        var business = await db.Businesses.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Business {id} not found");

        if (business.OwnerId != ownerId)
            throw new UnauthorizedAccessException("You do not own this business");

        return business;
    }

    private static BusinessPublicResponse ToPublicResponse(Business b) =>
        new(
            b.Id,
            b.Name,
            b.Type.ToString(),
            b.Slug,
            b.Address,
            b.Phone,
            b.Email,
            b.LogoUrl,
            b.BusinessHours.OrderBy(h => h.DayOfWeek).Select(ToHoursDto).ToList(),
            b.Staff.Select(s => new StaffSummaryDto(s.Id, s.Name, s.AvatarUrl,
                s.StaffServices.Select(ss => ss.ServiceId).ToList())).ToList(),
            b.Services.Select(s => new ServiceSummaryDto(
                s.Id, s.Name, s.Description, s.DurationMinutes, s.Price)).ToList()
        );

    private static BusinessHoursDto ToHoursDto(BusinessHours h) =>
        new(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed);
}
