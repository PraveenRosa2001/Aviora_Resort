using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

public class ForgotPasswordRequestDto
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
}