using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Read-only availability. Anonymous, because a guest checks dates long before
/// signing in. Nothing here writes to dbo.VillaInventory - the only writes are
/// on AdminInventoryController and, from module 5, inside the booking
/// transaction.
/// </summary>
[ApiController]
[AllowAnonymous]
[Produces("application/json")]
public class AvailabilityController : ControllerBase
{
    private readonly IInventoryService _inventory;

    public AvailabilityController(IInventoryService inventory) => _inventory = inventory;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    /// <summary>
    /// GET /api/villas/{villaCode}/availability?checkIn=2026-09-10&amp;checkOut=2026-09-14
    ///
    /// Always 200 when the villa exists. An unavailable stay comes back as
    /// available = false with a reason code, because "sold out" is an answer,
    /// not a failure.
    /// </summary>
    [HttpGet("api/villas/{villaCode}/availability")]
    public async Task<IActionResult> Check(string villaCode,
                                           [FromQuery] DateTime? checkIn,
                                           [FromQuery] DateTime? checkOut,
                                           [FromQuery] int units = 1)
        => FromResult(await _inventory.CheckAsync(villaCode, checkIn, checkOut, units));

    /// <summary>
    /// GET /api/villas/{villaCode}/calendar?from=2026-09-01&amp;to=2026-11-30
    ///
    /// Night-by-night: units left, blocks, minimum stay and the price for that
    /// night including any seasonal override. Drives the date picker.
    /// Defaults to the next 90 days, capped at 400.
    /// </summary>
    [HttpGet("api/villas/{villaCode}/calendar")]
    public async Task<IActionResult> Calendar(string villaCode,
                                              [FromQuery] DateTime? from,
                                              [FromQuery] DateTime? to)
        => FromResult(await _inventory.GetCalendarAsync(villaCode, from, to));
}