namespace AvioraResort.Models.DTOs;

/// <summary>
/// Shaped to match the objects in features/booking/villasData.js exactly, so
/// RoomsAndVillas.jsx and BookingPage.jsx need no field renaming.
///
/// Note Id is the VillaCode string ("canopy-villa-01"), not the integer
/// primary key. React already routes on that value (/booking?villa=...) and
/// stores it in bookingSlice.selectedVillaId.
/// </summary>
public class VillaDto
{
    public string Id { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }
    public decimal PricePerNight { get; set; }

    /// <summary>Lowest bookable nightly rate across the offered plans.</summary>
    public decimal FromPricePerNight { get; set; }

    /// <summary>All plans this villa sells, each priced for this villa.</summary>
    public List<RatePlanDto> RatePlans { get; set; } = new();

    public string Currency { get; set; } = "LKR";
    public int? Size { get; set; }
    public string? SizeUnit { get; set; }
    public int MaxOccupancy { get; set; }
    public string? BedConfiguration { get; set; }
    public string View { get; set; } = string.Empty;
    public string ViewName { get; set; } = string.Empty;

    /// <summary>Stay-specific when dates were supplied, otherwise indicative.</summary>
    public int AvailableSlots { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsDateFiltered { get; set; }
    public int TotalUnits { get; set; }
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? PopularBadge { get; set; }
    public string? Image { get; set; }
    public List<string> Images { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public bool Featured { get; set; }
    public string? Sustainability { get; set; }
}

public class VillaCategoryDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int VillaCount { get; set; }
}

public class AmenityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconName { get; set; }
}