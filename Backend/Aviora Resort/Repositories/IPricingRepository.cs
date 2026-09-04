using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IPricingRepository
{
    /* ---------- public ---------- */
    Task<List<RatePlan>> GetRatePlansAsync(bool includeInactive);
    Task<List<Addon>> GetAddonsAsync(bool includeInactive);
    Task<List<TaxComponent>> GetTaxComponentsAsync();
    Task<decimal> GetTaxMultiplierAsync();

    /// <summary>Status: 1 valid, -1 unknown, -2 out of date range, -3 usage limit, -4 stay too short.</summary>
    Task<(int Status, decimal DiscountPercent, string? Description)> ValidatePromoAsync(string code, int nights);

    /* ---------- administrator ---------- */
    Task<int> SaveRatePlanAsync(SaveRatePlanRequestDto request);
    Task<int> DeleteRatePlanAsync(string ratePlanCode);
    Task<int> SaveAddonAsync(SaveAddonRequestDto request);
    Task<int> DeleteAddonAsync(string addonCode);
    Task<List<PromoCode>> GetPromoCodesAsync();
    Task<int> SavePromoCodeAsync(SavePromoCodeRequestDto request);
    Task<int> DeletePromoCodeAsync(string code);
    Task<int> SaveVillaRatePlansAsync(string villaCode, SaveVillaRatePlansRequestDto request);
}