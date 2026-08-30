using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Rate plans, add-ons, promo codes and the tax cascade.
///
/// Nothing here decides who may call what - AdminPricingController carries
/// [Authorize(Roles = "admin")] and PricingController is anonymous.
/// </summary>
public class PricingService : IPricingService
{
    private readonly IPricingRepository _pricing;

    public PricingService(IPricingRepository pricing) => _pricing = pricing;

    private static readonly string[] AllowedChargeBases = { "PerStay", "PerNight", "PerGuest" };

    /* ================= public ================= */

    public async Task<ServiceResult<List<RatePlanDto>>> GetRatePlansAsync()
    {
        var plans = await _pricing.GetRatePlansAsync(includeInactive: false);
        return ServiceResult<List<RatePlanDto>>.Ok(plans.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<List<AddonDto>>> GetAddonsAsync()
    {
        var addons = await _pricing.GetAddonsAsync(includeInactive: false);
        return ServiceResult<List<AddonDto>>.Ok(addons.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<TaxBreakdownDto>> GetTaxBreakdownAsync()
    {
        var components = await _pricing.GetTaxComponentsAsync();
        var multiplier = await _pricing.GetTaxMultiplierAsync();

        return ServiceResult<TaxBreakdownDto>.Ok(new TaxBreakdownDto
        {
            Components = components.Select(c => new TaxComponentDto
            {
                Code = c.Code,
                DisplayName = c.DisplayName,
                Percentage = c.Percentage,
                ApplyOrder = c.ApplyOrder,
                Notes = c.Notes
            }).ToList(),
            Multiplier = multiplier,
            TotalPercent = Math.Round((multiplier - 1m) * 100m, 2)
        });
    }

    public async Task<ServiceResult<PromoValidationResultDto>> ValidatePromoAsync(PromoValidationRequestDto request)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var (status, percent, description) = await _pricing.ValidatePromoAsync(code, request.Nights);

        // A rejected code is a normal answer, not an error - the checkout shows
        // the message inline. Only status 1 sets Valid.
        var result = new PromoValidationResultDto { Code = code };

        switch (status)
        {
            case 1:
                result.Valid = true;
                result.DiscountPercent = percent;
                result.Message = $"{percent:0.##}% discount applied.";
                break;
            case -2:
                result.Message = "This promotional code is no longer valid for these dates.";
                break;
            case -3:
                result.Message = "This promotional code has reached its usage limit.";
                break;
            case -4:
                result.Message = $"This code requires a minimum stay of {description} nights.";
                break;
            default:
                result.Message = "That promotional code was not recognised.";
                break;
        }

        return ServiceResult<PromoValidationResultDto>.Ok(result);
    }

    /* ================= administrator ================= */

    public async Task<ServiceResult<List<RatePlanDto>>> GetRatePlansForAdminAsync()
    {
        var plans = await _pricing.GetRatePlansAsync(includeInactive: true);
        return ServiceResult<List<RatePlanDto>>.Ok(plans.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<string>> SaveRatePlanAsync(SaveRatePlanRequestDto request)
    {
        request.Id = request.Id.Trim().ToLowerInvariant();
        request.Name = request.Name.Trim();
        request.Features = request.Features
            .Where(f => !string.IsNullOrWhiteSpace(f))
            .Select(f => f.Trim())
            .ToList();

        if (request.Features.Count == 0)
            return ServiceResult<string>.Fail(
                "A rate plan needs at least one feature. Guests choose between plans on these lines.", 400);

        // A refundable plan without a window, or a non-refundable one with a
        // window, would print a contradiction on the villa page.
        if (request.IsRefundable && request.CancellationHours is null or <= 0)
            return ServiceResult<string>.Fail(
                "A refundable plan needs a cancellation window in hours.", 400);

        if (!request.IsRefundable && request.CancellationHours is > 0)
            return ServiceResult<string>.Fail(
                "A non-refundable plan cannot carry a cancellation window.", 400);

        var status = await _pricing.SaveRatePlanAsync(request);

        return status == 1
            ? ServiceResult<string>.Ok($"Rate plan '{request.Name}' saved.")
            : ServiceResult<string>.Fail("The rate plan could not be saved.", 500);
    }

    public async Task<ServiceResult<string>> DeleteRatePlanAsync(string ratePlanCode)
    {
        var rows = await _pricing.DeleteRatePlanAsync(ratePlanCode.Trim().ToLowerInvariant());

        // Soft only. Bookings will reference RatePlanId, and deleting the row
        // would erase the terms a guest actually agreed to.
        return rows > 0
            ? ServiceResult<string>.Ok(
                "Rate plan retired. It no longer appears on villa pages, and existing " +
                "reservations keep the terms they were booked under.")
            : ServiceResult<string>.Fail("That rate plan no longer exists.", 404);
    }

    public async Task<ServiceResult<List<AddonDto>>> GetAddonsForAdminAsync()
    {
        var addons = await _pricing.GetAddonsAsync(includeInactive: true);
        return ServiceResult<List<AddonDto>>.Ok(addons.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<string>> SaveAddonAsync(SaveAddonRequestDto request)
    {
        request.Id = request.Id.Trim().ToLowerInvariant();
        request.Name = request.Name.Trim();

        if (!AllowedChargeBases.Contains(request.ChargeBasis))
            return ServiceResult<string>.Fail(
                $"Charge basis must be one of: {string.Join(", ", AllowedChargeBases)}.", 400);

        var status = await _pricing.SaveAddonAsync(request);

        return status == 1
            ? ServiceResult<string>.Ok($"Add-on '{request.Name}' saved.")
            : ServiceResult<string>.Fail("The add-on could not be saved.", 500);
    }

    public async Task<ServiceResult<string>> DeleteAddonAsync(string addonCode)
    {
        var rows = await _pricing.DeleteAddonAsync(addonCode.Trim().ToLowerInvariant());
        return rows > 0
            ? ServiceResult<string>.Ok("Add-on retired. Existing reservations are unaffected.")
            : ServiceResult<string>.Fail("That add-on no longer exists.", 404);
    }

    public async Task<ServiceResult<List<PromoCode2Dto>>> GetPromoCodesAsync()
    {
        var codes = await _pricing.GetPromoCodesAsync();
        return ServiceResult<List<PromoCode2Dto>>.Ok(codes.Select(c => new PromoCode2Dto
        {
            Code = c.Code,
            Description = c.Description,
            DiscountPercent = c.DiscountPercent,
            ValidFrom = c.ValidFrom,
            ValidTo = c.ValidTo,
            MaxUses = c.MaxUses,
            UsedCount = c.UsedCount,
            MinNights = c.MinNights,
            IsActive = c.IsActive
        }).ToList());
    }

    public async Task<ServiceResult<string>> SavePromoCodeAsync(SavePromoCodeRequestDto request)
    {
        if (request.ValidFrom is not null && request.ValidTo is not null &&
            request.ValidTo < request.ValidFrom)
        {
            return ServiceResult<string>.Fail("The end date cannot fall before the start date.", 400);
        }

        var status = await _pricing.SavePromoCodeAsync(request);

        return status switch
        {
            1 => ServiceResult<string>.Ok($"Promotional code '{request.Code.ToUpperInvariant()}' saved."),
            -2 => ServiceResult<string>.Fail("The end date cannot fall before the start date.", 400),
            _ => ServiceResult<string>.Fail("The promotional code could not be saved.", 500)
        };
    }

    public async Task<ServiceResult<string>> DeletePromoCodeAsync(string code)
    {
        var rows = await _pricing.DeletePromoCodeAsync(code.Trim().ToUpperInvariant());
        return rows > 0
            ? ServiceResult<string>.Ok("Promotional code deactivated.")
            : ServiceResult<string>.Fail("That promotional code no longer exists.", 404);
    }

    public async Task<ServiceResult<string>> SaveVillaRatePlansAsync(
        string villaCode, SaveVillaRatePlansRequestDto request)
    {
        if (request.Plans.Count == 0)
            return ServiceResult<string>.Fail("No rate plan settings were supplied.", 400);

        if (request.Plans.All(p => !p.IsOffered))
            return ServiceResult<string>.Fail(
                "A villa must offer at least one rate plan, otherwise it cannot be booked.", 400);

        var status = await _pricing.SaveVillaRatePlansAsync(villaCode.Trim().ToLowerInvariant(), request);

        return status == 1
            ? ServiceResult<string>.Ok("Rate plan availability updated for this villa.")
            : ServiceResult<string>.Fail("That villa no longer exists.", 404);
    }

    /* ================= mapping ================= */

    private static RatePlanDto ToDto(RatePlan p) => new()
    {
        Id = p.RatePlanCode,
        Name = p.Name,
        Badge = p.Badge,
        Tagline = p.Tagline,
        DiscountPercent = p.DiscountPercent,
        PricePerNight = null,        // only meaningful inside a villa
        IsRefundable = p.IsRefundable,
        CancellationHours = p.CancellationHours,
        RequiresPrepayment = p.RequiresPrepayment,
        IsOffered = p.IsActive,
        Features = p.Features
    };

    private static AddonDto ToDto(Addon a) => new()
    {
        Id = a.AddonCode,
        Name = a.Name,
        Description = a.Description,
        Price = a.Price,
        Currency = a.Currency,
        Icon = a.Icon,
        ChargeBasis = a.ChargeBasis
    };
}