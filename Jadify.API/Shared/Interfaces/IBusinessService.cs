using Jadify.API.Features.Businesses;
using Microsoft.AspNetCore.Http;

namespace Jadify.API.Shared.Interfaces;

public interface IBusinessService
{
    Task<BusinessPublicResponse> GetBySlugAsync(string slug, CancellationToken ct = default);

    Task<BusinessPublicResponse> UpdateAsync(
        Guid id, string ownerId, UpdateBusinessRequest request, CancellationToken ct = default);

    Task<string> UploadLogoAsync(
        Guid id, string ownerId, IFormFile file, CancellationToken ct = default);

    Task<IReadOnlyList<BusinessHoursDto>> GetHoursAsync(Guid id, string ownerId, CancellationToken ct = default);

    Task<IReadOnlyList<BusinessHoursDto>> SetHoursAsync(
        Guid id, string ownerId, SetBusinessHoursRequest request, CancellationToken ct = default);
}
