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

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters in length")]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}