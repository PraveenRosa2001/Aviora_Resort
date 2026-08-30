using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

public class UpdateProfileRequestDto
{
    [Required, MaxLength(60)] public string FirstName { get; set; } = string.Empty;
    [Required, MaxLength(60)] public string LastName { get; set; } = string.Empty;
    [MaxLength(30)] public string? Phone { get; set; }
    [MaxLength(100)] public string? Country { get; set; }
    [MaxLength(300)] public string? Avatar { get; set; }
}