using System.ComponentModel.DataAnnotations;

namespace AvioraResort.Models.DTOs;

/// <summary>
/// Everything an administrator may set on a villa.
///
/// Rating and ReviewCount are absent on purpose. They are derived from
/// dbo.VillaReviews by usp_Villa_RecalcRating. If the console could type a
/// rating, the number on the card would contradict the guest reviews below it.
/// </summary>
public class SaveVillaRequestDto
{
    [Required, MaxLength(50)]
    [RegularExpression("^[a-z0-9-]+$",
        ErrorMessage = "The villa code may contain lowercase letters, numbers and hyphens only")]
    public string Id { get; set; } = string.Empty;          // VillaCode

    [Required, MaxLength(100)]
    [RegularExpression("^[a-z0-9-]+$",
        ErrorMessage = "The slug may contain lowercase letters, numbers and hyphens only")]
    public string Slug { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string Category { get; set; } = string.Empty;    // canopy | lagoon | treetop | beachfront

    [Required, MaxLength(30)]
    public string View { get; set; } = string.Empty;        // forest | ocean | garden | pool

    [MaxLength(300)] public string? Tagline { get; set; }
    [MaxLength(4000)] public string? Description { get; set; }

    [Range(1, 1000000, ErrorMessage = "The nightly rate must be greater than zero")]
    public decimal PricePerNight { get; set; }

    // MaxLength(3) with a default of "Rs. " is four characters, so every villa
    // save that did not send a currency failed model validation before it
    // reached the service. The column is NCHAR(3) and wants an ISO code.
    [MaxLength(3)] public string? Currency { get; set; } = "LKR";
    [Range(1, 100000)] public int? Size { get; set; }
    [MaxLength(10)] public string? SizeUnit { get; set; } = "sqm";

    [Range(1, 50, ErrorMessage = "Maximum occupancy must be between 1 and 50")]
    public int MaxOccupancy { get; set; }

    [MaxLength(120)] public string? BedConfiguration { get; set; }

    [Range(1, 500, ErrorMessage = "Total units must be at least 1")]
    public int TotalUnits { get; set; }

    //[Range(0, 500)] public int AvailableSlots { get; set; }

    public int InventoryNights { get; set; }

    [MaxLength(150)] public string? PopularBadge { get; set; }
    [MaxLength(300)] public string? Image { get; set; }   // MainImageUrl
    [MaxLength(500)] public string? Sustainability { get; set; }

    public bool Featured { get; set; }
    public int DisplayOrder { get; set; }

    /// <summary>Complete gallery. Sent whole; the procedure replaces the old set.</summary>
    public List<string> Images { get; set; } = new();

    /// <summary>Complete amenity list. Sent whole; the procedure replaces the old set.</summary>
    public List<string> Amenities { get; set; } = new();
}

/// <summary>
/// The public VillaDto plus the fields only the console needs.
/// Kept separate so IsActive never leaks onto the guest-facing endpoint.
/// </summary>
public class VillaAdminDto : VillaDto
{
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}