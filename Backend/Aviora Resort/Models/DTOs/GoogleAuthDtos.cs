using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

public class GoogleSignInRequestDto
{
    /// <summary>
    /// The ID token from Google Identity Services — the `credential` field of
    /// the callback.
    ///
    /// This is the ONLY thing the endpoint accepts. There is deliberately no
    /// email, name or picture parameter: anything the browser asserts about
    /// identity would have to be ignored, so it is better not to offer the
    /// field at all than to accept and discard it.
    /// </summary>
    [Required(ErrorMessage = "No Google credential was supplied.")]
    [MaxLength(4096)]
    public string IdToken { get; set; } = string.Empty;
}

/// <summary>
/// Told to the sign-in page so it can show or hide the Google button.
/// Returning the client id here means the frontend has one source for it
/// rather than a second copy in a .env that can drift.
/// </summary>
public class GoogleAuthConfigDto
{
    public bool Enabled { get; set; }
    public string? ClientId { get; set; }
}