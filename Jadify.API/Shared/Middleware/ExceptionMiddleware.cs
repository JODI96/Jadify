using Microsoft.AspNetCore.Mvc;

namespace Jadify.API.Shared.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception — {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await WriteProblemsAsync(context, ex);
        }
    }

    private static async Task WriteProblemsAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            KeyNotFoundException        => (StatusCodes.Status404NotFound,            "Resource not found"),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized,        "Authentication required"),
            ArgumentException           => (StatusCodes.Status400BadRequest,          "Invalid argument"),
            InvalidOperationException   => (StatusCodes.Status422UnprocessableEntity, "Operation not allowed"),
            _                           => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        context.Response.StatusCode  = statusCode;
        context.Response.ContentType = "application/problem+json";

        var detail = exception.InnerException is not null
            ? $"{exception.Message} | Inner: {exception.InnerException.Message}"
            : exception.Message;

        var problem = new ProblemDetails
        {
            Status   = statusCode,
            Title    = title,
            Detail   = detail,
            Instance = context.Request.Path
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
