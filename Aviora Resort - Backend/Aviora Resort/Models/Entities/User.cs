namespace AvioraResort.Models.Entities;

/// <summary>
/// Maps one row of dbo.Users. Contains PasswordHash and the lockout state,
/// so this type is never returned from a controller.
/// </summary>
public class User
{
    public int UserId { get; set; }
    public string UserCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Country { get; set; }
    public string RoleName { get; set; } = "guest";
    public string? Title { get; set; }
    public string? AvatarUrl { get; set; }
    public string? MembershipTier { get; set; }
    public int? MemberSince { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Added by 02_Auth_Security.sql
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public string? LastLoginIp { get; set; }

    public bool IsAdmin => RoleName.Equals("admin", StringComparison.OrdinalIgnoreCase);

    public bool IsLockedOut => LockoutEndUtc.HasValue && LockoutEndUtc.Value > DateTime.UtcNow;
}