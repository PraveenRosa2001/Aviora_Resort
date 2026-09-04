using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Business rules for villas: sanitising filter input, validating admin writes,
/// and shaping entities into the DTOs the React pages expect.
///
/// This class holds no authorisation logic. Who may call the admin methods is
/// decided by [Authorize(Roles = "admin")] on AdminVillasController.
/// </summary>
public class VillaService : IVillaService
{
    private readonly IVillaRepository _villas;

    public VillaService(IVillaRepository villas) => _villas = villas;

    private static readonly string[] AllowedSorts =
        { "featured", "price-asc", "price-desc", "rating" };

    private static readonly string[] AllowedCategories =
        { "canopy", "lagoon", "treetop", "beachfront" };

    private static readonly string[] AllowedViews =
        { "forest", "ocean", "garden", "pool" };

    /// <summary>
    /// dbo.VillaImages caps DisplayOrder at 1-6 with a unique index per villa,
    /// so a seventh gallery row would fail at the database. The limit is
    /// repeated here to produce a readable message instead of a 500.
    /// </summary>
    private const int MaxGalleryImages = 6;

    /* ================= public catalogue ================= */

    public async Task<ServiceResult<List<VillaDto>>> GetVillasAsync(VillaFilterDto filter)
    {
        var query = new VillaQuery
        {
            CategoryCode = Normalise(filter.Category),
            ViewCode = Normalise(filter.View),
            MinPrice = filter.MinPrice > 0 ? filter.MinPrice : null,
            MaxPrice = filter.MaxPrice > 0 ? filter.MaxPrice : null,
            FeaturedOnly = filter.Featured == true,
            MinOccupancy = BuildMinOccupancy(filter.Adults, filter.Children),
            SortBy = AllowedSorts.Contains(filter.SortBy ?? "") ? filter.SortBy! : "featured",
            CheckIn = filter.CheckIn,
            CheckOut = filter.CheckOut,
            OnlyAvailable = filter.OnlyAvailable,
        };

        if (query.MinPrice.HasValue && query.MaxPrice.HasValue && query.MinPrice > query.MaxPrice)
            return ServiceResult<List<VillaDto>>.Fail(
                "The minimum price cannot be greater than the maximum price.", 400);

        var villas = await _villas.GetAllAsync(query);
        return ServiceResult<List<VillaDto>>.Ok(villas.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<VillaDto>> GetVillaAsync(string villaCode, DateTime? checkIn = null, DateTime? checkOut = null)
    {
        if (string.IsNullOrWhiteSpace(villaCode))
            return ServiceResult<VillaDto>.Fail("A villa identifier is required.", 400);

        var villa = await _villas.GetByCodeAsync(villaCode.Trim(), checkIn, checkOut);

        return villa is null
            ? ServiceResult<VillaDto>.Fail("This villa is no longer available.", 404)
            : ServiceResult<VillaDto>.Ok(ToDto(villa));
    }

    public async Task<ServiceResult<List<VillaCategoryDto>>> GetCategoriesAsync()
    {
        var categories = await _villas.GetCategoriesAsync();
        return ServiceResult<List<VillaCategoryDto>>.Ok(
            categories.Select(c => new VillaCategoryDto
            {
                Code = c.CategoryCode,
                Name = c.CategoryName,
                VillaCount = c.VillaCount
            }).ToList());
    }

    public async Task<ServiceResult<List<AmenityDto>>> GetAmenitiesAsync()
    {
        var amenities = await _villas.GetAmenitiesAsync();
        return ServiceResult<List<AmenityDto>>.Ok(
            amenities.Select(a => new AmenityDto
            {
                Id = a.AmenityId,
                Name = a.AmenityName,
                IconName = a.IconName
            }).ToList());
    }

    /* ================= administrator ================= */

    public async Task<ServiceResult<List<VillaAdminDto>>> GetVillasForAdminAsync(bool includeInactive)
    {
        var villas = await _villas.GetAllForAdminAsync(includeInactive);
        return ServiceResult<List<VillaAdminDto>>.Ok(villas.Select(ToAdminDto).ToList());
    }

    public async Task<ServiceResult<VillaDto>> CreateVillaAsync(SaveVillaRequestDto request)
    {
        var validation = Validate(request);
        if (validation is not null)
            return ServiceResult<VillaDto>.Fail(validation, 400);

        var status = await _villas.CreateAsync(Sanitise(request));

        return status switch
        {
            -1 => ServiceResult<VillaDto>.Fail(
                      $"A villa with the code '{request.Id}' or slug '{request.Slug}' already exists.", 409),
            -2 => ServiceResult<VillaDto>.Fail("Unknown villa category or view.", 400),
            1 => await GetVillaAsync(request.Id),
            _ => ServiceResult<VillaDto>.Fail("The villa could not be created.", 500)
        };
    }

    public async Task<ServiceResult<VillaDto>> UpdateVillaAsync(string villaCode, SaveVillaRequestDto request)
    {
        // The code in the route identifies the row. A different code in the body
        // would otherwise let one villa's edit form overwrite another.
        request.Id = villaCode.Trim();

        var validation = Validate(request);
        if (validation is not null)
            return ServiceResult<VillaDto>.Fail(validation, 400);

        var status = await _villas.UpdateAsync(Sanitise(request));

        return status switch
        {
            -1 => ServiceResult<VillaDto>.Fail("That villa no longer exists.", 404),
            -2 => ServiceResult<VillaDto>.Fail("Unknown villa category or view.", 400),
            -3 => ServiceResult<VillaDto>.Fail(
                      $"The slug '{request.Slug}' is already used by another villa.", 409),
            1 => await GetVillaAsync(request.Id),
            _ => ServiceResult<VillaDto>.Fail("The villa could not be updated.", 500)
        };
    }

    public async Task<ServiceResult<string>> DeleteVillaAsync(string villaCode, bool force)
    {
        var status = await _villas.DeleteAsync(villaCode.Trim(), force);

        return status switch
        {
            1 => ServiceResult<string>.Ok(
                      "Villa retired. It no longer appears in the public collection, and its " +
                      "reviews and reservation history are preserved."),
            2 => ServiceResult<string>.Ok("Villa permanently deleted."),
            -1 => ServiceResult<string>.Fail("That villa no longer exists.", 404),
            -3 => ServiceResult<string>.Fail(
                      "This villa has reservations against it and cannot be permanently deleted. " +
                      "Retire it instead.", 409),
            _ => ServiceResult<string>.Fail("The villa could not be removed.", 500)
        };
    }

    public async Task<ServiceResult<string>> RestoreVillaAsync(string villaCode)
    {
        var rows = await _villas.RestoreAsync(villaCode.Trim());

        return rows > 0
            ? ServiceResult<string>.Ok("Villa restored to the public collection.")
            : ServiceResult<string>.Fail("That villa no longer exists.", 404);
    }

    /* ================= helpers ================= */

    /// <summary>
    /// Rules that data annotations cannot express. Returns null when valid.
    /// </summary>
    private static string? Validate(SaveVillaRequestDto v)
    {
        if (!AllowedCategories.Contains(v.Category?.Trim().ToLowerInvariant()))
            return $"Category must be one of: {string.Join(", ", AllowedCategories)}.";

        if (!AllowedViews.Contains(v.View?.Trim().ToLowerInvariant()))
            return $"View must be one of: {string.Join(", ", AllowedViews)}.";

        //if (v.AvailableSlots > v.TotalUnits)
        //    return "Available units cannot exceed the total number of units.";

        if (string.IsNullOrWhiteSpace(v.Image))
            return "A hero image is required. It is the photograph shown on the villa card.";

        if (v.Images.Count > MaxGalleryImages)
            return $"A villa may have at most {MaxGalleryImages} gallery images, " +
                   $"not counting the hero. You sent {v.Images.Count}.";

        if (v.Images.Any(i => string.Equals(i, v.Image, StringComparison.OrdinalIgnoreCase)))
            return "The hero image must not also appear in the gallery - it is always " +
                   "shown first, so it would be displayed twice.";

        if (v.Images.Count != v.Images.Distinct(StringComparer.OrdinalIgnoreCase).Count())
            return "The gallery contains the same image more than once.";

        if (v.Amenities.Count == 0)
            return "Please list at least one amenity.";

        return null;
    }

    /// <summary>Trims, lowercases the codes, and fills the main image if omitted.</summary>
    private static SaveVillaRequestDto Sanitise(SaveVillaRequestDto v)
    {
        v.Id = v.Id.Trim().ToLowerInvariant();
        v.Slug = v.Slug.Trim().ToLowerInvariant();
        v.Category = v.Category.Trim().ToLowerInvariant();
        v.View = v.View.Trim().ToLowerInvariant();
        v.Name = v.Name.Trim();

        v.Images = v.Images.Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).ToList();
        v.Amenities = v.Amenities.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).ToList();

        // The hero is stored once, in dbo.Villas.MainImageUrl. It used to be
        // pushed into the gallery list as well, which put it in dbo.VillaImages
        // too and made the carousel open with the same photograph twice.
        //
        // If no hero was given, promote the first gallery image and remove it
        // from the gallery so the two sets stay disjoint.
        if (string.IsNullOrWhiteSpace(v.Image) && v.Images.Count > 0)
        {
            v.Image = v.Images[0];
            v.Images.RemoveAt(0);
        }
        else if (!string.IsNullOrWhiteSpace(v.Image))
        {
            v.Images.RemoveAll(i => string.Equals(i, v.Image, StringComparison.OrdinalIgnoreCase));
        }

        // Trim to the six slots dbo.VillaImages allows. Validate() rejects an
        // over-long list before this point; the guard is here so a future
        // caller that skips validation cannot violate the unique index.
        if (v.Images.Count > MaxGalleryImages)
            v.Images = v.Images.Take(MaxGalleryImages).ToList();

        return v;
    }

    private static string? Normalise(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim().ToLowerInvariant();
        return trimmed == "all" ? null : trimmed;
    }

    private static int? BuildMinOccupancy(int? adults, int? children)
    {
        var total = (adults ?? 0) + (children ?? 0);
        return total > 0 ? total : null;
    }

    private static void Fill(VillaDto dto, Villa v)
    {
        dto.Id = v.VillaCode;
        dto.Slug = v.Slug;
        dto.Name = v.Name;
        dto.Category = v.CategoryCode;
        dto.CategoryName = v.CategoryName;
        dto.Tagline = v.Tagline;
        dto.Description = v.Description;
        dto.PricePerNight = v.PricePerNight;
        dto.FromPricePerNight = v.FromPricePerNight > 0 ? v.FromPricePerNight : v.PricePerNight;
        dto.RatePlans = v.RatePlans
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new RatePlanDto
            {
                Id = p.RatePlanCode,
                Name = p.RatePlanName,
                Badge = p.Badge,
                Tagline = p.Tagline,
                DiscountPercent = p.EffectiveDiscountPercent,
                PricePerNight = p.PricePerNight,
                IsRefundable = p.IsRefundable,
                CancellationHours = p.CancellationHours,
                RequiresPrepayment = p.RequiresPrepayment,
                HasOverride = p.HasOverride,
                IsOffered = p.IsOffered,
                Features = p.Features
            })
            .ToList();
        dto.Currency = v.Currency;
        dto.Size = v.Size;
        dto.SizeUnit = v.SizeUnit;
        dto.MaxOccupancy = v.MaxOccupancy;
        dto.BedConfiguration = v.BedConfiguration;
        dto.View = v.ViewCode;
        dto.ViewName = v.ViewName;
        dto.TotalUnits = v.TotalUnits;
        dto.AvailableSlots = v.AvailableSlots;
        dto.IsAvailable = v.IsAvailable;
        dto.IsDateFiltered = v.IsDateFiltered;
        dto.Rating = v.Rating;
        dto.ReviewCount = v.ReviewCount;
        dto.PopularBadge = v.PopularBadge;
        dto.Image = v.MainImageUrl ?? v.Images.FirstOrDefault()?.ImageUrl;
        dto.Images = v.Images.Select(i => i.ImageUrl).ToList();
        dto.Amenities = v.Amenities;
        dto.Featured = v.IsFeatured;
        dto.Sustainability = v.Sustainability;
    }

    private static VillaDto ToDto(Villa v)
    {
        var dto = new VillaDto();
        Fill(dto, v);
        return dto;
    }

    private static VillaAdminDto ToAdminDto(Villa v)
    {
        var dto = new VillaAdminDto
        {
            IsActive = v.IsActive,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
        Fill(dto, v);
        return dto;
    }
}