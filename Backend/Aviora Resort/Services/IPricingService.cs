using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IPricingService
{
    /* ---------- public ---------- */
    Task<ServiceResult<List<RatePlanDto>>> GetRatePlansAsync();
    Task<ServiceResult<List<AddonDto>>> GetAddonsAsync();
    Task<ServiceResult<TaxBreakdownDto>> GetTaxBreakdownAsync();
    Task<ServiceResult<PromoValidationResultDto>> ValidatePromoAsync(PromoValidationRequestDto request);

    /* ---------- administrator ---------- */
    Task<ServiceResult<List<RatePlanDto>>> GetRatePlansForAdminAsync();
    Task<ServiceResult<string>> SaveRatePlanAsync(SaveRatePlanRequestDto request);
    Task<ServiceResult<string>> DeleteRatePlanAsync(string ratePlanCode);

    Task<ServiceResult<List<AddonDto>>> GetAddonsForAdminAsync();
    Task<ServiceResult<string>> SaveAddonAsync(SaveAddonRequestDto request);
    Task<ServiceResult<string>> DeleteAddonAsync(string addonCode);

    Task<ServiceResult<List<PromoCode2Dto>>> GetPromoCodesAsync();
    Task<ServiceResult<string>> SavePromoCodeAsync(SavePromoCodeRequestDto request);
    Task<ServiceResult<string>> DeletePromoCodeAsync(string code);

    Task<ServiceResult<string>> SaveVillaRatePlansAsync(string villaCode, SaveVillaRatePlansRequestDto request);
}

/// <summary>Admin view of a promo code, including its usage counters.</summary>
public class PromoCode2Dto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DiscountPercent { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int? MaxUses { get; set; }
    public int UsedCount { get; set; }
    public int MinNights { get; set; }
    public bool IsActive { get; set; }
}