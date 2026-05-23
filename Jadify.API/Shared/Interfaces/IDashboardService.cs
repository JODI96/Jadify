using Jadify.API.Features.Dashboard;

namespace Jadify.API.Shared.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync(Guid businessId, CancellationToken ct = default);
}
