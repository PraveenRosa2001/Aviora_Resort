using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

public class RegisterRequestDto
{
    [Required(ErrorMessage = "First name is required")]
    [MaxLength(60)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(60)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Country of residence is required")]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    /// <summary>
    /// Raised from MinLength(6) with no complexity rule, so that registration
    /// and password reset demand the same thing.
    ///
    /// They have to match. Whichever is weaker is the one an attacker uses -
    /// and reset was the easier door, because it needs no account, only a
    /// link. Six characters with no complexity is inside the top few thousand
    /// guesses for most people.
    ///
    /// Existing passwords are unaffected; this only governs new ones.
    /// </summary>
    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [MaxLength(128, ErrorMessage = "Password must be under 128 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "Password must contain an uppercase letter, a lowercase letter and a digit")]
    public string Password { get; set; } = string.Empty;
}