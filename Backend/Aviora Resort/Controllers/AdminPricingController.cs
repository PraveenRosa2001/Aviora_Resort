using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Rate plans, add-ons and promo codes are resort policy, so every write
/// lives here behind [Authorize(Roles = "admin")] on the class.
///
/// Guests read the same data through PricingController, which has no write
/// routes at all. There is no path from a guest endpoint into these
/// procedures.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminPricingController : ControllerBase
{
    private readonly IPricingService _pricing;

    public AdminPricingController(IPricingService pricing) => _pricing = pricing;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private IActionResult FromMessage(ServiceResult<string> result) =>
        result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private string FirstValidationError() =>
        ModelState.Values.SelectMany(v => v.Errors)
                         .Select(e => e.ErrorMessage)
                         .FirstOrDefault() ?? "Invalid request.";

    /* ---------------- rate plans ---------------- */

    /// <summary>GET /api/admin/rate-plans — includes retired plans.</summary>
    [HttpGet("rate-plans")]
    public async Task<IActionResult> GetRatePlans()
        => FromResult(await _pricing.GetRatePlansForAdminAsync());

    /// <summary>
    /// PUT /api/admin/rate-plans/{code}
    /// Upsert. The code in the route wins, so one plan's form cannot overwrite
    /// another.
    /// </summary>
    [HttpPut("rate-plans/{ratePlanCode}")]
    public async Task<IActionResult> SaveRatePlan(string ratePlanCode,
                                                  [FromBody] SaveRatePlanRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        request.Id = ratePlanCode;
        return FromMessage(await _pricing.SaveRatePlanAsync(request));
    }

    /// <summary>POST /api/admin/rate-plans — create a new plan.</summary>
    [HttpPost("rate-plans")]
    public async Task<IActionResult> CreateRatePlan([FromBody] SaveRatePlanRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _pricing.SaveRatePlanAsync(request));
    }

    /// <summary>DELETE /api/admin/rate-plans/{code} — soft retire.</summary>
    [HttpDelete("rate-plans/{ratePlanCode}")]
    public async Task<IActionResult> DeleteRatePlan(string ratePlanCode)
        => FromMessage(await _pricing.DeleteRatePlanAsync(ratePlanCode));

    /* ---------------- per-villa rate plan availability ---------------- */

    /// <summary>
    /// PUT /api/admin/villas/{villaCode}/rate-plans
    /// Which plans this villa sells, and any per-villa modifier override.
    /// The plan definitions themselves are not editable here - that is the
    /// point of keeping them in one place.
    /// </summary>
    [HttpPut("villas/{villaCode}/rate-plans")]
    public async Task<IActionResult> SaveVillaRatePlans(string villaCode,
                                                        [FromBody] SaveVillaRatePlansRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _pricing.SaveVillaRatePlansAsync(villaCode, request));
    }

    /* ---------------- add-ons ---------------- */

    [HttpGet("addons")]
    public async Task<IActionResult> GetAddons()
        => FromResult(await _pricing.GetAddonsForAdminAsync());

    [HttpPut("addons/{addonCode}")]
    public async Task<IActionResult> SaveAddon(string addonCode,
                                               [FromBody] SaveAddonRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        request.Id = addonCode;
        return FromMessage(await _pricing.SaveAddonAsync(request));
    }

    [HttpPost("addons")]
    public async Task<IActionResult> CreateAddon([FromBody] SaveAddonRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _pricing.SaveAddonAsync(request));
    }

    [HttpDelete("addons/{addonCode}")]
    public async Task<IActionResult> DeleteAddon(string addonCode)
        => FromMessage(await _pricing.DeleteAddonAsync(addonCode));

    /* ---------------- promo codes ---------------- */

    [HttpGet("promocodes")]
    public async Task<IActionResult> GetPromoCodes()
        => FromResult(await _pricing.GetPromoCodesAsync());

    [HttpPost("promocodes")]
    public async Task<IActionResult> SavePromoCode([FromBody] SavePromoCodeRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _pricing.SavePromoCodeAsync(request));
    }

    [HttpDelete("promocodes/{code}")]
    public async Task<IActionResult> DeletePromoCode(string code)
        => FromMessage(await _pricing.DeletePromoCodeAsync(code));
}