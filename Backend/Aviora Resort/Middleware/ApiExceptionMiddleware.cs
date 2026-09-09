using System.Text.Json;

namespace AvioraResort.Middleware;

/// <summary>
/// Turns an unhandled exception into a JSON response that still carries its
/// CORS headers.
///
/// Why this exists
/// ---------------
/// ASP.NET's developer exception page calls Response.Clear() before writing
/// its HTML. That discards the Access-Control-Allow-Origin header UseCors had
/// queued, so the browser refuses the response and reports
///
///     TypeError: Failed to fetch          0 B transferred
///     Provisional headers are shown
///
/// The 500 is real and the message is usually specific, but none of it
/// reaches the developer tools. Every server fault looks like a network
/// fault, which is a long way to debug from.
///
/// Registered FIRST in the pipeline so it wraps everything below it, and it
/// writes with Response.WriteAsync rather than clearing, so the headers
/// survive.
/// </summary>
public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ApiExceptionMiddleware(RequestDelegate next,
                                  ILogger<ApiExceptionMiddleware> logger,
                                  IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                             context.Request.Method, context.Request.Path);

            // If the response has already begun there is nothing safe to do -
            // rewriting it would corrupt whatever was streamed.
            if (context.Response.HasStarted) throw;

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            // The detail is Development-only. In production a stack trace in
            // the response body tells an attacker your table names.
            var body = _env.IsDevelopment()
                ? new
                {
                    message = "The server could not complete the request.",
                    error = ex.GetType().Name,
                    detail = ex.Message,
                    path = context.Request.Path.Value
                }
                : (object)new { message = "The server could not complete the request." };

            await context.Response.WriteAsync(JsonSerializer.Serialize(body,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
        }
    }
}