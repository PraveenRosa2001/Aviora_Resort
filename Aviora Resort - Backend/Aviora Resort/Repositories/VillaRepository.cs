using Microsoft.Data.SqlClient;
using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

/// <summary>
/// Data access for the villa tables.
///
/// usp_Villa_GetAll, usp_Villa_GetByCode and usp_Admin_Villa_GetAll all return
/// the same three result sets - villas, images, amenities - so all three reuse
/// ReadVillaGraphAsync.
/// </summary>
public class VillaRepository : IVillaRepository
{
    private readonly SqlHelper _db;

    public VillaRepository(SqlHelper db) => _db = db;

    private static Villa MapVilla(SqlDataReader rd)
    {
        var villa = new Villa
        {
            VillaId = rd.GetInt("VillaId"),
            VillaCode = rd.GetStringValue("VillaCode"),
            Slug = rd.GetStringValue("Slug"),
            Name = rd.GetStringValue("Name"),
            CategoryCode = rd.GetStringValue("CategoryCode"),
            CategoryName = rd.GetStringValue("CategoryName"),
            ViewCode = rd.GetStringValue("ViewCode"),
            ViewName = rd.GetStringValue("ViewName"),
            Tagline = rd.GetNullableString("Tagline"),
            Description = rd.GetNullableString("Description"),
            PricePerNight = rd.GetDecimal("PricePerNight"),
            Currency = rd.GetStringValue("Currency").Trim(),
            Size = rd.GetNullableInt("Size"),
            SizeUnit = rd.GetNullableString("SizeUnit"),
            MaxOccupancy = rd.GetInt("MaxOccupancy"),
            BedConfiguration = rd.GetNullableString("BedConfiguration"),
            TotalUnits = rd.GetInt("TotalUnits"),
            AvailableSlots = rd.GetInt("AvailableSlots"),
            Rating = rd.GetNullableDecimal("Rating"),
            ReviewCount = rd.GetInt("ReviewCount"),
            PopularBadge = rd.GetNullableString("PopularBadge"),
            MainImageUrl = rd.GetNullableString("MainImageUrl"),
            Sustainability = rd.GetNullableString("Sustainability"),
            IsFeatured = rd.GetBool("IsFeatured"),
            DisplayOrder = rd.GetInt("DisplayOrder")

        };

        if (rd.HasColumn("FromPricePerNight"))
            villa.FromPricePerNight = rd.GetDecimal("FromPricePerNight");

        // Only the admin procedure selects these three columns.
        if (rd.HasColumn("IsActive")) villa.IsActive = rd.GetBool("IsActive");
        if (rd.HasColumn("CreatedAt")) villa.CreatedAt = rd.GetDate("CreatedAt");
        if (rd.HasColumn("UpdatedAt")) villa.UpdatedAt = rd.GetNullableDate("UpdatedAt");

        if (rd.HasColumn("IsAvailable")) villa.IsAvailable = rd.GetBool("IsAvailable");
        if (rd.HasColumn("IsDateFiltered")) villa.IsDateFiltered = rd.GetBool("IsDateFiltered");
        if (rd.HasColumn("InventoryNights")) villa.InventoryNights = rd.GetInt("InventoryNights");

        return villa;
    }

    /// <summary>
    /// Reads the three result sets and attaches children to parents.
    /// A dictionary keyed on VillaId avoids an O(n*m) scan per image or amenity.
    /// </summary>
    private static async Task<List<Villa>> ReadVillaGraphAsync(SqlDataReader rd)
    {
        var villas = new List<Villa>();
        while (await rd.ReadAsync())
            villas.Add(MapVilla(rd));

        if (villas.Count == 0)
            return villas;

        var byId = villas.ToDictionary(v => v.VillaId);

        if (await rd.NextResultAsync())
        {
            while (await rd.ReadAsync())
            {
                var villaId = rd.GetInt("VillaId");
                if (byId.TryGetValue(villaId, out var villa))
                {
                    villa.Images.Add(new VillaImage
                    {
                        VillaId = villaId,
                        ImageUrl = rd.GetStringValue("ImageUrl"),
                        AltText = rd.GetNullableString("AltText"),
                        DisplayOrder = rd.GetInt("DisplayOrder")
                    });
                }
            }
        }

        if (await rd.NextResultAsync())
        {
            while (await rd.ReadAsync())
            {
                var villaId = rd.GetInt("VillaId");
                if (byId.TryGetValue(villaId, out var villa))
                    villa.Amenities.Add(rd.GetStringValue("AmenityName"));
            }
        }

        // result set 4 - rate plans, already priced for each villa
        var plansByCode = new Dictionary<string, List<VillaRatePlan>>(StringComparer.OrdinalIgnoreCase);

        if (await rd.NextResultAsync())
        {
            while (await rd.ReadAsync())
            {
                var villaId = rd.GetInt("VillaId");
                if (!byId.TryGetValue(villaId, out var villa)) continue;

                var plan = new VillaRatePlan
                {
                    VillaId = villaId,
                    RatePlanCode = rd.GetStringValue("RatePlanCode"),
                    RatePlanName = rd.GetStringValue("RatePlanName"),
                    Badge = rd.GetNullableString("Badge"),
                    Tagline = rd.GetNullableString("Tagline"),
                    EffectiveDiscountPercent = rd.GetDecimal("EffectiveDiscountPercent"),
                    PricePerNight = rd.GetDecimal("PricePerNight"),
                    IsRefundable = rd.GetBool("IsRefundable"),
                    CancellationHours = rd.GetNullableInt("CancellationHours"),
                    RequiresPrepayment = rd.GetBool("RequiresPrepayment"),
                    DisplayOrder = rd.GetInt("DisplayOrder"),
                    HasOverride = rd.GetBool("HasOverride"),
                    // Only the admin procedure selects IsOffered; the guest one
                    // filters the row out entirely, so absence means offered.
                    IsOffered = !rd.HasColumn("IsOffered") || rd.GetBool("IsOffered")
                };

                villa.RatePlans.Add(plan);

                if (!plansByCode.TryGetValue(plan.RatePlanCode, out var list))
                    plansByCode[plan.RatePlanCode] = list = new List<VillaRatePlan>();
                list.Add(plan);
            }
        }

        // result set 5 - the feature bullets, keyed by plan code rather than by
        // villa, because the same three plans are shared across every villa.
        // One pass fills every copy.
        if (await rd.NextResultAsync())
        {
            while (await rd.ReadAsync())
            {
                var code = rd.GetStringValue("RatePlanCode");
                var text = rd.GetStringValue("FeatureText");

                if (plansByCode.TryGetValue(code, out var copies))
                {
                    foreach (var plan in copies)
                        plan.Features.Add(text);
                }
            }
        }

        return villas;
    }

    /* ---------------- public catalogue ---------------- */

    public Task<List<Villa>> GetAllAsync(VillaQuery query) =>
        _db.QueryMultipleAsync("dbo.usp_Villa_GetAll", p =>
        {
            p.AddWithValue("@CategoryCode", (object?)query.CategoryCode ?? DBNull.Value);
            p.AddWithValue("@ViewCode", (object?)query.ViewCode ?? DBNull.Value);
            p.AddWithValue("@MinPrice", (object?)query.MinPrice ?? DBNull.Value);
            p.AddWithValue("@MaxPrice", (object?)query.MaxPrice ?? DBNull.Value);
            p.AddWithValue("@MinOccupancy", (object?)query.MinOccupancy ?? DBNull.Value);
            p.AddWithValue("@FeaturedOnly", query.FeaturedOnly);
            p.AddWithValue("@SortBy", query.SortBy);
            p.AddWithValue("@CheckIn", (object?)query.CheckIn?.Date ?? DBNull.Value);
            p.AddWithValue("@CheckOut", (object?)query.CheckOut?.Date ?? DBNull.Value);
            p.AddWithValue("@OnlyAvailable", query.OnlyAvailable);
        }, ReadVillaGraphAsync);

    //public async Task<Villa?> GetByCodeAsync(string villaCode)
    //{
    //    var villas = await _db.QueryMultipleAsync("dbo.usp_Villa_GetByCode",
    //        p => p.AddWithValue("@VillaCode", villaCode), ReadVillaGraphAsync);

    //    return villas.FirstOrDefault();
    //}

    public async Task<Villa?> GetByCodeAsync(string villaCode,
                                         DateTime? checkIn = null,
                                         DateTime? checkOut = null)
    {
        var villas = await _db.QueryMultipleAsync("dbo.usp_Villa_GetByCode", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@CheckIn", (object?)checkIn?.Date ?? DBNull.Value);
            p.AddWithValue("@CheckOut", (object?)checkOut?.Date ?? DBNull.Value);
        }, ReadVillaGraphAsync);

        return villas.FirstOrDefault();
    }

    public Task<List<VillaCategory>> GetCategoriesAsync() =>
        _db.QueryListAsync("dbo.usp_Villa_GetCategories", null, rd => new VillaCategory
        {
            CategoryCode = rd.GetStringValue("CategoryCode"),
            CategoryName = rd.GetStringValue("CategoryName"),
            DisplayOrder = rd.GetInt("DisplayOrder"),
            VillaCount = rd.GetInt("VillaCount")
        });

    public Task<List<Amenity>> GetAmenitiesAsync() =>
        _db.QueryListAsync("dbo.usp_Villa_GetAmenities", null, rd => new Amenity
        {
            AmenityId = rd.GetInt("AmenityId"),
            AmenityName = rd.GetStringValue("AmenityName"),
            IconName = rd.GetNullableString("IconName")
        });

    /* ---------------- administrator ---------------- */

    public Task<List<Villa>> GetAllForAdminAsync(bool includeInactive) =>
        _db.QueryMultipleAsync("dbo.usp_Admin_Villa_GetAll",
            p => p.AddWithValue("@IncludeInactive", includeInactive),
            ReadVillaGraphAsync);

    /// <summary>
    /// Shared parameter block for create and update. The images and amenities
    /// travel as table-valued parameters, so the whole villa is written in one
    /// call inside one transaction.
    /// </summary>
    private static void AddVillaParameters(SqlParameterCollection p, SaveVillaRequestDto v)
    {
        p.AddWithValue("@VillaCode", v.Id);
        p.AddWithValue("@Slug", v.Slug);
        p.AddWithValue("@Name", v.Name);
        p.AddWithValue("@CategoryCode", v.Category);
        p.AddWithValue("@ViewCode", v.View);
        p.AddWithValue("@Tagline", (object?)v.Tagline ?? DBNull.Value);
        p.AddWithValue("@Description", (object?)v.Description ?? DBNull.Value);
        p.AddWithValue("@PricePerNight", v.PricePerNight);
        p.AddWithValue("@Currency", string.IsNullOrWhiteSpace(v.Currency) ? "LKR" : v.Currency);
        p.AddWithValue("@Size", (object?)v.Size ?? DBNull.Value);
        p.AddWithValue("@SizeUnit", (object?)v.SizeUnit ?? DBNull.Value);
        p.AddWithValue("@MaxOccupancy", v.MaxOccupancy);
        p.AddWithValue("@BedConfiguration", (object?)v.BedConfiguration ?? DBNull.Value);
        p.AddWithValue("@TotalUnits", v.TotalUnits);
        //p.AddWithValue("@AvailableSlots", v.AvailableSlots);
        p.AddWithValue("@PopularBadge", (object?)v.PopularBadge ?? DBNull.Value);
        p.AddWithValue("@MainImageUrl", (object?)v.Image ?? DBNull.Value);
        p.AddWithValue("@Sustainability", (object?)v.Sustainability ?? DBNull.Value);
        p.AddWithValue("@IsFeatured", v.Featured);
        p.AddWithValue("@DisplayOrder", v.DisplayOrder);

        p.AddStructured("@Images", "dbo.VillaImageList", v.Images.ToVillaImageTable(v.Name));
        p.AddStructured("@Amenities", "dbo.VillaAmenityList", v.Amenities.ToVillaAmenityTable());
    }

    public Task<int> CreateAsync(SaveVillaRequestDto villa) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Villa_Create",
            p => AddVillaParameters(p, villa));

    public Task<int> UpdateAsync(SaveVillaRequestDto villa) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Villa_Update",
            p => AddVillaParameters(p, villa));

    public Task<int> DeleteAsync(string villaCode, bool force) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Villa_Delete", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddWithValue("@Force", force);
        });

    public Task<int> RestoreAsync(string villaCode) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Villa_Restore",
            p => p.AddWithValue("@VillaCode", villaCode));
}