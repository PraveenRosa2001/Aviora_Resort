using Microsoft.AspNetCore.Mvc;

namespace AvioraResort.Models.DTOs;

/// <summary>
/// Query string for GET /api/villas. Every property is optional.
/// Mirrors the filter state in RoomsAndVillas.jsx:
///   categoryFilter, viewFilter, maxPrice, adults + children, sortBy
/// </summary>
public class VillaFilterDto
{
    /// <summary>canopy | lagoon | treetop | beachfront. "all" is treated as no filter.</summary>
    [FromQuery(Name = "category")]
    public string? Category { get; set; }

    /// <summary>forest | ocean | garden | pool. "all" is treated as no filter.</summary>
    [FromQuery(Name = "view")]
    public string? View { get; set; }

    [FromQuery(Name = "minPrice")]
    public decimal? MinPrice { get; set; }

    [FromQuery(Name = "maxPrice")]
    public decimal? MaxPrice { get; set; }

    /// <summary>Guest count. The API converts it to MaxOccupancy >= adults + children.</summary>
    [FromQuery(Name = "adults")]
    public int? Adults { get; set; }

    [FromQuery(Name = "children")]
    public int? Children { get; set; }

    [FromQuery(Name = "featured")]
    public bool? Featured { get; set; }

    /// <summary>featured | price-asc | price-desc | rating</summary>
    [FromQuery(Name = "sortBy")]
    public string? SortBy { get; set; }

    [FromQuery(Name = "checkIn")] public DateTime? CheckIn { get; set; }
    [FromQuery(Name = "checkOut")] public DateTime? CheckOut { get; set; }
    [FromQuery(Name = "onlyAvailable")] public bool OnlyAvailable { get; set; }
}