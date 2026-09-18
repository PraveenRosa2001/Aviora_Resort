using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

public class ResetPasswordRequestDto
{
    [Required(ErrorMessage = "The reset link is incomplete.")]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// The same strength rules registration uses.
    ///
    /// This was [Required, MinLength(6)] — no complexity rule and two
    /// characters shorter than the sign-up form. A reset that accepts
    /// "123456" is a door around the registration policy, and it is the
    /// easier door to find: no account needed, just a reset link.
    /// </summary>
    [Required(ErrorMessage = "A new password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [MaxLength(128, ErrorMessage = "Password must be under 128 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "Password must contain an uppercase letter, a lowercase letter and a digit")]
    public string NewPassword { get; set; } = string.Empty;
}