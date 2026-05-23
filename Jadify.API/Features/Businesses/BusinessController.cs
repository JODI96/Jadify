using Jadify.API.Shared.Extensions;
using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Features.Businesses;

[ApiController]
[Route("api/businesses")]
public class BusinessController(IBusinessService businessService) : ControllerBase
{
    /// <summary>Returns the public profile of a business including services and staff.</summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<BusinessPublicResponse>> GetBySlug(
        string slug, CancellationToken ct)
        => Ok(await businessService.GetBySlugAsync(slug, ct));

    /// <summary>Updates the authenticated owner's business profile.</summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<BusinessPublicResponse>> Update(
        Guid id, UpdateBusinessRequest request, CancellationToken ct)
        => Ok(await businessService.UpdateAsync(id, User.GetUserId()!, request, ct));

    /// <summary>Uploads a logo image to Azure Blob Storage.</summary>
    [HttpPost("{id:guid}/logo")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<LogoUploadResponse>> UploadLogo(
        Guid id, IFormFile file, CancellationToken ct)
    {
        var url = await businessService.UploadLogoAsync(id, User.GetUserId()!, file, ct);
        return Ok(new LogoUploadResponse(url));
    }

    /// <summary>Replaces all opening hours for the business.</summary>
    [HttpPost("{id:guid}/hours")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<BusinessHoursDto>>> SetHours(
        Guid id, SetBusinessHoursRequest request, CancellationToken ct)
        => Ok(await businessService.SetHoursAsync(id, User.GetUserId()!, request, ct));
}
