using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

/// <summary>
/// Field names match the review objects RoomsAndVillas.jsx already renders,
/// so the modal markup needs no renaming.
/// </summary>
public class ReviewDto
{
    public string Id { get; set; } = string.Empty;   // ReviewCode
    public string VillaId { get; set; } = string.Empty;   // VillaCode
    public string VillaName { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string? GuestOrigin { get; set; }
    public int Rating { get; set; }
    public string? Headline { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? StayDate { get; set; }
    public int HelpfulCount { get; set; }
    public bool IsVerified { get; set; }
    public bool HasVoted { get; set; }
    public bool IsMine { get; set; }
}

/// <summary>
/// Note what is NOT here: guestName. The old form let the guest type any name,
/// which meant one account could post as anybody. The name now comes from the
/// JWT on the server side and the client cannot influence it.
/// </summary>
public class CreateReviewRequestDto
{
    [Required]
    [Range(1, 5, ErrorMessage = "Please select a rating between 1 and 5 stars")]
    public int Rating { get; set; }

    [MaxLength(150)]
    public string? Headline { get; set; }

    [Required(ErrorMessage = "Please tell us about your stay")]
    [MinLength(10, ErrorMessage = "Please share at least 10 characters about your stay experience")]
    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;

    /// <summary>Optional display origin, e.g. "Colombo, Sri Lanka".</summary>
    [MaxLength(120)]
    public string? GuestOrigin { get; set; }
}