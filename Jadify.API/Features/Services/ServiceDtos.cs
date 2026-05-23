namespace Jadify.API.Features.Services;

public record ServiceResponse(
    Guid    Id,
    string  Name,
    string? Description,
    int     DurationMinutes,
    decimal Price,
    bool    IsActive,
    DateTime CreatedAt
);

public record CreateServiceRequest(
    string  Name,
    string? Description,
    int     DurationMinutes,
    decimal Price
);

public record UpdateServiceRequest(
    string  Name,
    string? Description,
    int     DurationMinutes,
    decimal Price,
    bool    IsActive
);
