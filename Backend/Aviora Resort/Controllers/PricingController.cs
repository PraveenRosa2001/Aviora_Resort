using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Read-only pricing reference data: rate plans, add-ons, the tax cascade,
/// and promo code validation. Anonymous, because a guest has to be able to
/// price a stay before signing in.
///
/// Nothing here writes. Every change to a rate plan, add-on or promo code
/// goes through AdminPricingController, behind [Authorize(Roles = "admin")].
/// </summary>
[ApiController]
[AllowAnonymous]
[Produces("application/json")]
public class PricingController : ControllerBase
{
    private readonly IPricingService _pricing;

    public PricingController(IPricingService pricing) => _pricing = pricing;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    /// <summary>
    /// GET /api/rate-plans
    /// The three plans with their feature bullets. PricePerNight is null here -
    /// a plan has no price of its own, only a modifier. The priced version
    /// comes back inside each villa from GET /api/villas.
    /// </summary>
    [HttpGet("api/rate-plans")]
    public async Task<IActionResult> GetRatePlans()
        => FromResult(await _pricing.GetRatePlansAsync());

    /// <summary>GET /api/addons</summary>
    [HttpGet("api/addons")]
    public async Task<IActionResult> GetAddons()
        => FromResult(await _pricing.GetAddonsAsync());

    /// <summary>
    /// GET /api/taxes
    /// The Sri Lankan cascade - service charge, TDL, SSCL, VAT - with the
    /// combined multiplier, so the checkout can itemise instead of printing
    /// one opaque percentage.
    /// </summary>
    [HttpGet("api/taxes")]
    public async Task<IActionResult> GetTaxes()
        => FromResult(await _pricing.GetTaxBreakdownAsync());

    /// <summary>
    /// POST /api/promocodes/validate
    /// Always 200. An unknown or expired code returns valid = false with a
    /// message; it is a normal answer, not an error.
    /// </summary>
    [HttpPost("api/promocodes/validate")]
    public async Task<IActionResult> ValidatePromo([FromBody] PromoValidationRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(
                ModelState.Values.SelectMany(v => v.Errors)
                                 .Select(e => e.ErrorMessage)
                                 .FirstOrDefault() ?? "Invalid request."));

        return FromResult(await _pricing.ValidatePromoAsync(request));
    }
}