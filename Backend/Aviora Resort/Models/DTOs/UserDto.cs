namespace AvioraResort.Models.DTOs;

/// <summary>
/// Safe view of a user. Property names mirror the object authSlice.js already
/// stores, so the React side needs no reshaping.
/// </summary>
public class UserDto
{
    public string Id { get; set; } = string.Empty;   // UserCode
    public string Name { get; set; } = string.Empty;   // "First Last"
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "guest";
    public string? Title { get; set; }
    public string? Phone { get; set; }
    public string? Country { get; set; }
    public string? Avatar { get; set; }
    public string? MembershipTier { get; set; }
    public string? MemberSince { get; set; }
}