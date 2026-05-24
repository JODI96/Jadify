using Jadify.API.Shared.Enums;

namespace Jadify.API.Features.Businesses;

// ── Public business page ──────────────────────────────────────────────────────

public record BusinessPublicResponse(
    Guid    Id,
    string  Name,
    string  Type,
    string  Slug,
    string  Address,
    string  Phone,
    string  Email,
    string? LogoUrl,
    IReadOnlyList<BusinessHoursDto>  Hours,
    IReadOnlyList<StaffSummaryDto>   Staff,
    IReadOnlyList<ServiceSummaryDto> Services
);

public record BusinessHoursDto(
    DayOfWeek DayOfWeek,
    TimeOnly  OpenTime,
    TimeOnly  CloseTime,
    bool      IsClosed
);

public record StaffSummaryDto(Guid Id, string Name, string? AvatarUrl, IReadOnlyList<Guid> ServiceIds);

public record ServiceSummaryDto(
    Guid    Id,
    string  Name,
    string? Description,
    int     DurationMinutes,
    decimal Price
);

// ── Update profile ────────────────────────────────────────────────────────────

public record UpdateBusinessRequest(
    string       Name,
    BusinessType Type,
    string       Address,
    string       Phone,
    string       Email
);

// ── Opening hours ─────────────────────────────────────────────────────────────

public record SetBusinessHoursRequest(
    IReadOnlyList<BusinessHoursItemRequest> Hours
);

public record BusinessHoursItemRequest(
    DayOfWeek DayOfWeek,
    TimeOnly  OpenTime,
    TimeOnly  CloseTime,
    bool      IsClosed
);

// ── Logo ──────────────────────────────────────────────────────────────────────

public record LogoUploadResponse(string LogoUrl);
