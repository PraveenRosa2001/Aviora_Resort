using System.Data;
using Microsoft.Data.SqlClient;
using AvioraResort.Data;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public class PricingRepository : IPricingRepository
{
    private readonly SqlHelper _db;

    public PricingRepository(SqlHelper db) => _db = db;

    /* ================= public ================= */

    /// <summary>
    /// usp_RatePlan_GetAll returns the plans, then their features. Read as one
    /// round trip and stitched on RatePlanId.
    /// </summary>
    public Task<List<RatePlan>> GetRatePlansAsync(bool includeInactive) =>
        _db.QueryMultipleAsync("dbo.usp_RatePlan_GetAll",
            p => p.AddWithValue("@IncludeInactive", includeInactive),
            async rd =>
            {
                var plans = new List<RatePlan>();
                while (await rd.ReadAsync())
                {
                    plans.Add(new RatePlan
                    {
                        RatePlanId = rd.GetInt("RatePlanId"),
                        RatePlanCode = rd.GetStringValue("RatePlanCode"),
                        Name = rd.GetStringValue("Name"),
                        Badge = rd.GetNullableString("Badge"),
                        Tagline = rd.GetNullableString("Tagline"),
                        DiscountPercent = rd.GetDecimal("DiscountPercent"),
                        IsRefundable = rd.GetBool("IsRefundable"),
                        CancellationHours = rd.GetNullableInt("CancellationHours"),
                        RequiresPrepayment = rd.GetBool("RequiresPrepayment"),
                        DisplayOrder = rd.GetInt("DisplayOrder"),
                        IsActive = rd.GetBool("IsActive"),
                        CreatedAt = rd.GetDate("CreatedAt"),
                        UpdatedAt = rd.GetNullableDate("UpdatedAt")
                    });
                }

                var byId = plans.ToDictionary(p => p.RatePlanId);

                if (await rd.NextResultAsync())
                {
                    while (await rd.ReadAsync())
                    {
                        var id = rd.GetInt("RatePlanId");
                        if (byId.TryGetValue(id, out var plan))
                            plan.Features.Add(rd.GetStringValue("FeatureText"));
                    }
                }

                return plans;
            });

    public Task<List<Addon>> GetAddonsAsync(bool includeInactive) =>
        _db.QueryListAsync("dbo.usp_Addon_GetAll",
            p => p.AddWithValue("@IncludeInactive", includeInactive),
            rd => new Addon
            {
                AddonId = rd.GetInt("AddonId"),
                AddonCode = rd.GetStringValue("AddonCode"),
                Name = rd.GetStringValue("Name"),
                Description = rd.GetNullableString("Description"),
                Price = rd.GetDecimal("Price"),
                Currency = rd.GetStringValue("Currency").Trim(),
                Icon = rd.GetNullableString("Icon"),
                ChargeBasis = rd.GetStringValue("ChargeBasis"),
                DisplayOrder = rd.GetInt("DisplayOrder"),
                IsActive = rd.GetBool("IsActive")
            });

    public Task<List<TaxComponent>> GetTaxComponentsAsync() =>
        _db.QueryListAsync("dbo.usp_Tax_GetComponents", null, rd => new TaxComponent
        {
            Code = rd.GetStringValue("Code"),
            DisplayName = rd.GetStringValue("DisplayName"),
            Percentage = rd.GetDecimal("Percentage"),
            ApplyOrder = rd.GetInt("ApplyOrder"),
            Notes = rd.GetNullableString("Notes")
        });

    /// <summary>
    /// The multiplier is the second result set of usp_Tax_GetComponents. It is
    /// computed in SQL by ufn_TaxMultiplier so the API and any future report
    /// cannot disagree about the arithmetic.
    /// </summary>
    public Task<decimal> GetTaxMultiplierAsync() =>
        _db.QueryMultipleAsync("dbo.usp_Tax_GetComponents", null, async rd =>
        {
            while (await rd.ReadAsync()) { }          // skip the component rows
            if (await rd.NextResultAsync() && await rd.ReadAsync())
                return rd.GetDecimal("TaxMultiplier");
            return 1m;
        });

    public async Task<(int Status, decimal DiscountPercent, string? Description)>
        ValidatePromoAsync(string code, int nights)
    {
        var row = await _db.QuerySingleAsync("dbo.usp_PromoCode_Validate", p =>
        {
            p.AddWithValue("@Code", code);
            p.AddWithValue("@Nights", nights);
        },
        rd => (
            Status: rd.GetInt("Status"),
            DiscountPercent: rd.GetDecimal("DiscountPercent"),
            Description: rd.GetNullableString("Description")
        ));

        return row;
    }

    /* ================= administrator ================= */

    private static DataTable ToFeatureTable(IEnumerable<string>? features)
    {
        var table = new DataTable();
        table.Columns.Add("FeatureText", typeof(string));
        table.Columns.Add("DisplayOrder", typeof(int));

        var order = 1;
        foreach (var f in (features ?? Enumerable.Empty<string>())
                          .Where(f => !string.IsNullOrWhiteSpace(f))
                          .Select(f => f.Trim()))
        {
            table.Rows.Add(f, order++);
        }
        return table;
    }

    public Task<int> SaveRatePlanAsync(SaveRatePlanRequestDto r) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_RatePlan_Save", p =>
        {
            p.AddWithValue("@RatePlanCode", r.Id);
            p.AddWithValue("@Name", r.Name);
            p.AddWithValue("@Badge", (object?)r.Badge ?? DBNull.Value);
            p.AddWithValue("@Tagline", (object?)r.Tagline ?? DBNull.Value);
            p.AddWithValue("@DiscountPercent", r.DiscountPercent);
            p.AddWithValue("@IsRefundable", r.IsRefundable);
            p.AddWithValue("@CancellationHours", (object?)r.CancellationHours ?? DBNull.Value);
            p.AddWithValue("@RequiresPrepayment", r.RequiresPrepayment);
            p.AddWithValue("@DisplayOrder", r.DisplayOrder);
            p.AddWithValue("@IsActive", r.IsActive);
            p.AddStructured("@Features", "dbo.RatePlanFeatureList", ToFeatureTable(r.Features));
        });

    public Task<int> DeleteRatePlanAsync(string ratePlanCode) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_RatePlan_Delete",
            p => p.AddWithValue("@RatePlanCode", ratePlanCode));

    public Task<int> SaveAddonAsync(SaveAddonRequestDto r) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Addon_Save", p =>
        {
            p.AddWithValue("@AddonCode", r.Id);
            p.AddWithValue("@Name", r.Name);
            p.AddWithValue("@Description", (object?)r.Description ?? DBNull.Value);
            p.AddWithValue("@Price", r.Price);
            p.AddWithValue("@Icon", (object?)r.Icon ?? DBNull.Value);
            p.AddWithValue("@ChargeBasis", r.ChargeBasis);
            p.AddWithValue("@DisplayOrder", r.DisplayOrder);
            p.AddWithValue("@IsActive", r.IsActive);
        });

    public Task<int> DeleteAddonAsync(string addonCode) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_Addon_Delete",
            p => p.AddWithValue("@AddonCode", addonCode));

    public Task<List<PromoCode>> GetPromoCodesAsync() =>
        _db.QueryListAsync("dbo.usp_Admin_PromoCode_GetAll", null, rd => new PromoCode
        {
            PromoId = rd.GetInt("PromoId"),
            Code = rd.GetStringValue("Code"),
            Description = rd.GetNullableString("Description"),
            DiscountPercent = rd.GetDecimal("DiscountPercent"),
            ValidFrom = rd.GetNullableDate("ValidFrom"),
            ValidTo = rd.GetNullableDate("ValidTo"),
            MaxUses = rd.GetNullableInt("MaxUses"),
            UsedCount = rd.GetInt("UsedCount"),
            MinNights = rd.GetInt("MinNights"),
            IsActive = rd.GetBool("IsActive"),
            CreatedAt = rd.GetDate("CreatedAt")
        });

    public Task<int> SavePromoCodeAsync(SavePromoCodeRequestDto r) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_PromoCode_Save", p =>
        {
            p.AddWithValue("@Code", r.Code.Trim().ToUpperInvariant());
            p.AddWithValue("@Description", (object?)r.Description ?? DBNull.Value);
            p.AddWithValue("@DiscountPercent", r.DiscountPercent);
            p.AddWithValue("@ValidFrom", (object?)r.ValidFrom ?? DBNull.Value);
            p.AddWithValue("@ValidTo", (object?)r.ValidTo ?? DBNull.Value);
            p.AddWithValue("@MaxUses", (object?)r.MaxUses ?? DBNull.Value);
            p.AddWithValue("@MinNights", r.MinNights);
            p.AddWithValue("@IsActive", r.IsActive);
        });

    public Task<int> DeletePromoCodeAsync(string code) =>
        _db.ExecuteScalarAsync<int>("dbo.usp_Admin_PromoCode_Delete",
            p => p.AddWithValue("@Code", code));

    public Task<int> SaveVillaRatePlansAsync(string villaCode, SaveVillaRatePlansRequestDto request)
    {
        var table = new DataTable();
        table.Columns.Add("RatePlanCode", typeof(string));
        table.Columns.Add("IsOffered", typeof(bool));
        table.Columns.Add("DiscountPercentOverride", typeof(decimal));

        foreach (var plan in request.Plans.Where(p => !string.IsNullOrWhiteSpace(p.RatePlanId)))
        {
            table.Rows.Add(
                plan.RatePlanId.Trim(),
                plan.IsOffered,
                (object?)plan.DiscountPercentOverride ?? DBNull.Value);
        }

        return _db.ExecuteScalarAsync<int>("dbo.usp_Admin_VillaRatePlan_Save", p =>
        {
            p.AddWithValue("@VillaCode", villaCode);
            p.AddStructured("@Plans", "dbo.VillaRatePlanList", table);
        });
    }
}