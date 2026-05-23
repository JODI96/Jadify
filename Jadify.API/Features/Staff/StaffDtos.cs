namespace Jadify.API.Features.Staff;

public record StaffResponse(
    Guid     Id,
    string   Name,
    string   Email,
    string?  AvatarUrl,
    bool     IsActive,
    DateTime CreatedAt
);

public record CreateStaffRequest(
    string  Name,
    string  Email
);

public record UpdateStaffRequest(
    string  Name,
    string  Email,
    bool    IsActive
);
