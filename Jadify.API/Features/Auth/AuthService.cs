using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Jadify.API.Shared.Data;
using Jadify.API.Shared.Enums;
using Jadify.API.Shared.Helpers;
using Jadify.API.Shared.Interfaces;
using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Jadify.API.Features.Auth;

public class AuthService(
    UserManager<IdentityUser> userManager,
    JadifyDbContext db,
    IConfiguration config,
    IEmailService emailService,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var user = new IdentityUser { UserName = request.Email, Email = request.Email };
        var createResult = await userManager.CreateAsync(user, request.Password);

        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Registration failed: {errors}");
        }

        try
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);

            var baseSlug = SlugHelper.Generate(request.BusinessName);
            var slug = await db.Businesses.AnyAsync(b => b.Slug == baseSlug, ct)
                ? SlugHelper.MakeUnique(baseSlug)
                : baseSlug;

            var business = new Business
            {
                OwnerId      = user.Id,
                Name         = request.BusinessName,
                Type         = request.BusinessType,
                Slug         = slug,
                Address      = request.Address,
                Phone        = request.Phone,
                Email        = request.Email
            };
            db.Businesses.Add(business);

            db.Subscriptions.Add(new Subscription
            {
                BusinessId = business.Id,
                Tier       = SubscriptionTier.Free
            });

            // Default opening hours: Mon–Sat 09:00–18:00, Sun closed
            for (int d = 0; d <= 6; d++)
            {
                db.BusinessHours.Add(new BusinessHours
                {
                    BusinessId = business.Id,
                    DayOfWeek  = (DayOfWeek)d,
                    OpenTime   = new TimeOnly(9, 0),
                    CloseTime  = new TimeOnly(18, 0),
                    IsClosed   = d == 0,
                });
            }

            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // Welcome email is best-effort — a failure must not roll back registration
            _ = emailService.SendWelcomeAsync(request.Email, request.OwnerName)
                .ContinueWith(t => logger.LogWarning(t.Exception, "Welcome email failed for {Email}", request.Email),
                    TaskContinuationOptions.OnlyOnFaulted);

            return await IssueTokensAsync(user, business.Id, business.Type, business.Slug, ct);
        }
        catch
        {
            // Identity user was created above; clean it up if the business creation fails
            await userManager.DeleteAsync(user);
            throw;
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password");

        var business = await db.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.OwnerId == user.Id, ct)
            ?? throw new InvalidOperationException("No business found for this account");

        return await IssueTokensAsync(user, business.Id, business.Type, business.Slug, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        // Refresh token format: "{userId}|{base64RandomBytes}"
        var separator = refreshToken.IndexOf('|');
        if (separator < 0)
            throw new UnauthorizedAccessException("Invalid refresh token");

        var userId    = refreshToken[..separator];
        var tokenPart = refreshToken[(separator + 1)..];

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("Invalid refresh token");

        var stored = await userManager.GetAuthenticationTokenAsync(user, "Jadify", "RefreshToken");
        if (stored != tokenPart)
            throw new UnauthorizedAccessException("Invalid refresh token");

        var business = await db.Businesses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.OwnerId == user.Id, ct)
            ?? throw new InvalidOperationException("No business found for this account");

        return await IssueTokensAsync(user, business.Id, business.Type, business.Slug, ct);
    }

    public async Task ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        // Always return success to prevent email enumeration
        if (user is null) return;

        var token      = await userManager.GeneratePasswordResetTokenAsync(user);
        var frontendUrl = config["FrontendUrl"] ?? "https://app.jadify.ch";
        var resetUrl   = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";

        try { await emailService.SendPasswordResetAsync(email, resetUrl, ct); }
        catch (Exception ex) { logger.LogWarning(ex, "Password reset email failed for {Email}", email); }
    }

    public async Task ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new InvalidOperationException("Ungültige Anfrage");

        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Passwort konnte nicht zurückgesetzt werden: {errors}");
        }
    }

    // -------------------------------------------------------------------------

    private async Task<AuthResponse> IssueTokensAsync(IdentityUser user, Guid businessId, BusinessType businessType, string slug, CancellationToken ct)
    {
        var expiryMinutes = int.TryParse(config["Jwt:ExpiryMinutes"], out var m) ? m : 60;
        var expiresAt     = DateTime.UtcNow.AddMinutes(expiryMinutes);
        var accessToken   = GenerateJwt(user, businessId, expiresAt);

        // Rotate refresh token on every issuance
        var randomPart   = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var refreshToken = $"{user.Id}|{randomPart}";
        await userManager.SetAuthenticationTokenAsync(user, "Jadify", "RefreshToken", randomPart);

        return new AuthResponse(accessToken, refreshToken, expiresAt, businessId, user.Email!, businessType.ToString(), slug);
    }

    private string GenerateJwt(IdentityUser user, Guid businessId, DateTime expiresAt)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email,          user.Email!),
            new("business_id",             businessId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        ];

        var token = new JwtSecurityToken(
            issuer:            config["Jwt:Issuer"],
            audience:          config["Jwt:Audience"],
            claims:            claims,
            expires:           expiresAt,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
