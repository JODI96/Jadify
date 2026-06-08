using Jadify.API.Shared.Enums;

namespace Jadify.API.Features.Auth;

public record RegisterRequest(
    string OwnerName,
    string Email,
    string Password,
    string BusinessName,
    BusinessType BusinessType,
    string Address,
    string Phone
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshRequest(
    string RefreshToken
);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    Guid BusinessId,
    string Email,
    string BusinessType,
    string Slug
);
