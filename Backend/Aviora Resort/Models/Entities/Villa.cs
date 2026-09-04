namespace AvioraResort.Models.Entities;

/// <summary>Maps one row of dbo.Villas, joined to its category and view.</summary>
public class Villa
{
    public int VillaId { get; set; }
    public string VillaCode { get; set; } = string.Empty;   // canopy-villa-01
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string ViewCode { get; set; } = string.Empty;
    public string ViewName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public decimal PricePerNight { get; set; }
    // ISO code, not a display symbol. dbo.Villas.Currency is NCHAR(3), so
    // "Rs. " is four characters and does not fit. "Rs." belongs in the UI.
    public string Currency { get; set; } = "LKR";
    public int? Size { get; set; }
    public string? SizeUnit { get; set; }
    public int MaxOccupancy { get; set; }
    public string? BedConfiguration { get; set; }
    public int TotalUnits { get; set; }

    /// <summary>
    /// Free units. With stay dates supplied this is the tightest night in the
    /// range; without them, the best any single night in the next 90 days can
    /// offer. Computed from dbo.VillaInventory, never stored.
    /// </summary>
    public int AvailableSlots { get; set; }

    /// <summary>False when the villa is sold out or closed for the dates asked for.</summary>
    public bool IsAvailable { get; set; } = true;

    /// <summary>True when the caller supplied dates, so AvailableSlots is stay-specific.</summary>
    public bool IsDateFiltered { get; set; }

    /// <summary>Admin list only: how many nights of calendar exist from today.</summary>
    public int InventoryNights { get; set; }
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? PopularBadge { get; set; }
    public string? MainImageUrl { get; set; }
    public string? Sustainability { get; set; }
    public bool IsFeatured { get; set; }
    public int DisplayOrder { get; set; }

    /// <summary>
    /// The cheapest offered rate plan for this villa. With the default plans
    /// that is the Saver rate at base x 0.85. This is what a collection card
    /// should advertise, because it is the lowest price a guest can actually
    /// book.
    /// </summary>
    public decimal FromPricePerNight { get; set; }

    /// <summary>Offered plans with the nightly price already applied.</summary>
    public List<VillaRatePlan> RatePlans { get; set; } = new();
    public List<VillaImage> Images { get; set; } = new();
    public List<string> Amenities { get; set; } = new();

    // Populated only by usp_Admin_Villa_GetAll. The public procedure does not
    // select these, and the guest-facing VillaDto does not expose them.
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class VillaImage
{
    public int VillaId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int DisplayOrder { get; set; }
}

public class VillaCategory
{
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int VillaCount { get; set; }
}

public class Amenity
{
    public int AmenityId { get; set; }
    public string AmenityName { get; set; } = string.Empty;
    public string? IconName { get; set; }
}