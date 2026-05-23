using System.Security.Claims;

namespace Jadify.API.Shared.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Returns the ASP.NET Identity user ID from the JWT subject claim.</summary>
    public static string? GetUserId(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>Returns the user's email address from the JWT email claim.</summary>
    public static string? GetEmail(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimTypes.Email);

    /// <summary>
    /// Returns the BusinessId stored as a custom claim in the JWT.
    /// Added to the token during login by AuthService.
    /// </summary>
    public static Guid? GetBusinessId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue("business_id");
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
