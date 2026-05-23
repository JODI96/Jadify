namespace Jadify.API.Features.Tables;

public record TableResponse(
    Guid     Id,
    string   Name,
    int      Capacity,
    bool     IsActive,
    DateTime CreatedAt
);

public record CreateTableRequest(
    string Name,
    int    Capacity
);

public record UpdateTableRequest(
    string Name,
    int    Capacity,
    bool   IsActive
);
