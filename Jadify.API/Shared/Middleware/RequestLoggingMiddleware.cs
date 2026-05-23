using Serilog.Context;

namespace Jadify.API.Shared.Middleware;

/// <summary>
/// Stamps every request with a correlation ID and pushes it into the Serilog
/// log context so all log entries for a request share the same ID.
/// </summary>
public class RequestLoggingMiddleware(RequestDelegate next)
{
    private const string CorrelationHeader = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[CorrelationHeader].FirstOrDefault()
            ?? Guid.NewGuid().ToString("N");

        context.Response.Headers[CorrelationHeader] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}
