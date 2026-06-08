using System.Reflection;
using System.Text;
using Azure.Storage.Blobs;
using FluentValidation;
using FluentValidation.AspNetCore;
using Jadify.API.Features.Auth;
using Jadify.API.Features.Bookings;
using Jadify.API.Features.Businesses;
using Jadify.API.Features.Dashboard;
using Jadify.API.Features.Payments;
using Jadify.API.Features.Subscriptions;
using Jadify.API.Shared.Interfaces;
using Jadify.API.Shared.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SendGrid;
using Stripe;

namespace Jadify.API.Shared.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>Configures JWT Bearer authentication + authorization policies.</summary>
    public static IServiceCollection AddJadifyAuthentication(
        this IServiceCollection services, IConfiguration config)
    {
        var key     = config["Jwt:Key"]      ?? throw new InvalidOperationException("Jwt:Key is required");
        var issuer  = config["Jwt:Issuer"]!;
        var audience = config["Jwt:Audience"]!;

        services
            .AddAuthentication(opts =>
            {
                opts.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opts.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(opts =>
            {
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ValidateIssuer           = true,
                    ValidIssuer              = issuer,
                    ValidateAudience         = true,
                    ValidAudience            = audience,
                    ValidateLifetime         = true,
                    ClockSkew                = TimeSpan.Zero   // no grace period on expiry
                };
            });

        services.AddAuthorization();
        return services;
    }

    /// <summary>Registers Stripe, Azure Blob Storage, and SendGrid clients as singletons.</summary>
    public static IServiceCollection AddJadifyInfrastructure(
        this IServiceCollection services, IConfiguration config, IHostEnvironment env)
    {
        // --- Stripe ---
        var stripeKey = config["Stripe:SecretKey"] ?? string.Empty;
        StripeConfiguration.ApiKey = stripeKey;
        // Use a placeholder when unconfigured so DI resolution doesn't blow up on
        // unrelated endpoints. Actual Stripe API calls will still fail at call time.
        services.AddSingleton<IStripeClient>(_ =>
            new StripeClient(string.IsNullOrWhiteSpace(stripeKey) ? "sk_test_dev_placeholder" : stripeKey));

        // --- Azure Blob Storage ---
        var blobConnStr = config["Azure:BlobStorageConnectionString"] ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(blobConnStr))
            services.AddSingleton(_ => new BlobServiceClient(blobConnStr));

        // --- SendGrid ---
        var sgKey = config["SendGrid:ApiKey"] ?? string.Empty;
        if (env.IsProduction() && string.IsNullOrWhiteSpace(sgKey))
            throw new InvalidOperationException("SendGrid:ApiKey is required in production");
        if (!string.IsNullOrWhiteSpace(sgKey))
            services.AddSingleton<ISendGridClient>(_ => new SendGridClient(sgKey));

        return services;
    }

    /// <summary>
    /// Registers FluentValidation auto-validation and scans the assembly for all validators.
    /// </summary>
    public static IServiceCollection AddJadifyValidation(this IServiceCollection services)
    {
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        return services;
    }

    /// <summary>Configures CORS to allow the React frontend origin.</summary>
    public static IServiceCollection AddJadifyCors(
        this IServiceCollection services, IConfiguration config)
    {
        var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173", "https://app.jadify.ch"];

        services.AddCors(opts =>
            opts.AddPolicy("JadifyPolicy", policy =>
                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials()));

        return services;
    }

    /// <summary>
    /// Registers all feature-level services. Each step below adds its own registrations.
    /// </summary>
    public static IServiceCollection AddJadifyFeatureServices(this IServiceCollection services, IConfiguration config)
    {
        // Step 5
        services.AddScoped<IAuthService, AuthService>();
        var sgKey = config["SendGrid:ApiKey"] ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(sgKey))
            services.AddScoped<IEmailService, SendGridEmailService>();
        else
            services.AddScoped<IEmailService, NullEmailService>();

        // Step 6
        services.AddScoped<IBusinessService, BusinessService>();

        // TODO: Step 7  — services.AddScoped<IBookingService, BookingService>()
        // Step 7
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<IBookingService, BookingService>();
        // Step 8
        services.AddScoped<IPaymentService, PaymentService>();
        // Step 9
        services.AddScoped<StripeSubscriptionService>();
        services.AddScoped<ISubscriptionService, Jadify.API.Features.Subscriptions.SubscriptionService>();
        // Step 10
        services.AddScoped<IDashboardService, DashboardService>();

        // Background services
        services.AddHostedService<ReminderBackgroundService>();

        return services;
    }
}
