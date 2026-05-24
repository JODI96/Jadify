namespace Jadify.API.Features.Staff;

public record StaffResponse(
    Guid                Id,
    string              Name,
    string              Email,
    string?             AvatarUrl,
    bool                IsActive,
    DateTime            CreatedAt,
    IReadOnlyList<Guid> ServiceIds
);

public record CreateStaffRequest(
    string               Name,
    string               Email,
    string?              AvatarUrl,
    IReadOnlyList<Guid>? ServiceIds   // null = all services of the business
);

public record UpdateStaffRequest(
    string               Name,
    string               Email,
    bool                 IsActive,
    string?              AvatarUrl,
    IReadOnlyList<Guid>? ServiceIds
);
