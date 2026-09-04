namespace AvioraResort.Models.DTOs;

/// <summary>
/// Request metadata the controller collects and hands to the service layer.
/// Keeps HttpContext out of AuthService.
/// </summary>
public class LoginContext
{
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}