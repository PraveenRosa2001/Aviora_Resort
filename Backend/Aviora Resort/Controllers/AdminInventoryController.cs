using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Inventory management: the occupancy grid, bulk edits across a date range,
/// and rolling the booking horizon forward.
///
/// [Authorize(Roles = "admin")] on the class. A guest reaching any of these
/// could close a villa to sale or set its rate to zero.
/// </summary>
[ApiController]
[Route("api/admin/inventory")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminInventoryController : ControllerBase
{
    private readonly IInventoryService _inventory;

    public AdminInventoryController(IInventoryService inventory) => _inventory = inventory;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private IActionResult FromMessage(ServiceResult<string> result) =>
        result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    /// <summary>
    /// GET /api/admin/inventory?from=2026-09-01&amp;to=2026-09-30
    /// Every villa, every night, plus an occupancy summary per villa.
    /// Defaults to the next 30 days, capped at 120.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetGrid([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => FromResult(await _inventory.GetGridAsync(from, to));

    /// <summary>
    /// PUT /api/admin/inventory/{villaCode}
    ///
    /// A bulk edit across a range. Omitted fields are left alone, so closing a
    /// week for maintenance does not disturb its pricing. Optionally limited to
    /// certain weekdays for weekend rates.
    /// </summary>
    [HttpPut("{villaCode}")]
    public async Task<IActionResult> SetRange(string villaCode,
                                              [FromBody] SetInventoryRangeDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(
                ModelState.Values.SelectMany(v => v.Errors)
                                 .Select(e => e.ErrorMessage)
                                 .FirstOrDefault() ?? "Invalid request."));

        return FromMessage(await _inventory.SetRangeAsync(villaCode, request));
    }

    /// <summary>
    /// POST /api/admin/inventory/extend?horizonDays=540
    ///
    /// Inventory is a finite calendar, so something must keep opening dates or
    /// the resort silently stops taking bookings past the horizon. Also picks
    /// up villas that have no inventory rows yet.
    /// </summary>
    [HttpPost("extend")]
    public async Task<IActionResult> Extend([FromQuery] int horizonDays = 540)
        => FromMessage(await _inventory.ExtendHorizonAsync(horizonDays));
}