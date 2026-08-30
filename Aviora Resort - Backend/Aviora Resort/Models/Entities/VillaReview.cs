namespace AvioraResort.Models.Entities;

/// <summary>Maps one row of dbo.VillaReviews joined to its villa.</summary>
public class VillaReview
{
    public string ReviewCode { get; set; } = string.Empty;
    public string VillaCode { get; set; } = string.Empty;
    public string VillaName { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string? GuestOrigin { get; set; }
    public byte Rating { get; set; }
    public string? Headline { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? StayDate { get; set; }
    public int HelpfulCount { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>True when the signed-in guest has already voted this review helpful.</summary>
    public bool HasVoted { get; set; }

    /// <summary>True when the signed-in guest wrote this review.</summary>
    public bool IsMine { get; set; }
}