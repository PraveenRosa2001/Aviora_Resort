namespace AvioraResort.Models.DTOs;

/// <summary>
/// Returned by GET /api/admin/session. The front end calls this before showing
/// the admin console, so the decision to render it comes from the server rather
/// than from a role value sitting in localStorage.
/// </summary>
public class AdminSessionDto
{
    public string UserCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime? LastLoginAtUtc { get; set; }
    public string? LastLoginIp { get; set; }
    public DateTime TokenExpiresAtUtc { get; set; }
}