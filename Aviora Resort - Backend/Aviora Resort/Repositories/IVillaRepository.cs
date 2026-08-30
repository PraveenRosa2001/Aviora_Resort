//using AvioraResort.Models.Entities;
//using AvioraResort.Models.Entities;

//namespace AvioraResort.Repositories;

//public interface IVillaRepository
//{
//    Task<List<Villa>> GetAllAsync(VillaQuery query);
//    Task<Villa?> GetByCodeAsync(string villaCode);
//    Task<List<VillaCategory>> GetCategoriesAsync();
//    Task<List<Amenity>> GetAmenitiesAsync();
//}

///// <summary>
///// Repository-level filter. Separate from VillaFilterDto so the data layer
///// does not depend on ASP.NET Core model binding attributes.
///// </summary>
//public class VillaQuery
//{
//    public string? CategoryCode { get; set; }
//    public string? ViewCode { get; set; }
//    public decimal? MinPrice { get; set; }
//    public decimal? MaxPrice { get; set; }
//    public int? MinOccupancy { get; set; }
//    public bool FeaturedOnly { get; set; }
//    public string SortBy { get; set; } = "featured";
//}

using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IVillaRepository
{
    /* ---------- public catalogue ---------- */
    Task<List<Villa>> GetAllAsync(VillaQuery query);
    Task<Villa?> GetByCodeAsync(string villaCode,
                                DateTime? checkIn = null,
                                DateTime? checkOut = null);
    Task<List<VillaCategory>> GetCategoriesAsync();
    Task<List<Amenity>> GetAmenitiesAsync();

    /* ---------- administrator ----------
       Reached only through AdminVillasController, which carries
       [Authorize(Roles = "admin")]. */
    Task<List<Villa>> GetAllForAdminAsync(bool includeInactive);

    /// <summary>Status: 1 created, -1 duplicate code or slug, -2 unknown category or view.</summary>
    Task<int> CreateAsync(SaveVillaRequestDto villa);

    /// <summary>Status: 1 updated, -1 not found, -2 unknown category or view, -3 slug clash.</summary>
    Task<int> UpdateAsync(SaveVillaRequestDto villa);

    /// <summary>Status: 1 retired, 2 hard-deleted, -1 not found, -3 has bookings.</summary>
    Task<int> DeleteAsync(string villaCode, bool force);

    /// <summary>Rows affected: 1 restored, 0 not found.</summary>
    Task<int> RestoreAsync(string villaCode);
}

/// <summary>
/// Repository-level filter. Separate from VillaFilterDto so the data layer
/// does not depend on ASP.NET Core model binding attributes.
/// </summary>
public class VillaQuery
{
    public string? CategoryCode { get; set; }
    public string? ViewCode { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinOccupancy { get; set; }
    public bool FeaturedOnly { get; set; }
    public string SortBy { get; set; } = "featured";

    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public bool OnlyAvailable { get; set; }
}