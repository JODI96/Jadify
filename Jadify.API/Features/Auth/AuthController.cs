using Jadify.API.Shared.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Features.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Registers a new business owner and returns tokens.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request, CancellationToken ct)
        => Ok(await authService.RegisterAsync(request, ct));

    /// <summary>Authenticates a business owner and returns tokens.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request, CancellationToken ct)
        => Ok(await authService.LoginAsync(request, ct));

    /// <summary>Rotates the refresh token and issues a new access token.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(
        RefreshRequest request, CancellationToken ct)
        => Ok(await authService.RefreshAsync(request.RefreshToken, ct));

    /// <summary>Sends a password reset email. Always returns 200 to prevent email enumeration.</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request, CancellationToken ct)
    {
        await authService.ForgotPasswordAsync(request.Email, ct);
        return Ok(new { message = "Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet." });
    }

    /// <summary>Resets the password using the token from the email link.</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request, CancellationToken ct)
    {
        await authService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword, ct);
        return Ok(new { message = "Passwort erfolgreich zurückgesetzt." });
    }
}
