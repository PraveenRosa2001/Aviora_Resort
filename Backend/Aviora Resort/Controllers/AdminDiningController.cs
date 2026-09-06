using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// The dining desk and venue management.
///
/// [Authorize(Roles = "admin")] on the class. These routes read guests'
/// dietary notes and contact details and can retire a venue, so the boundary
/// is here rather than in React.
/// </summary>
[ApiController]
[Route("api/admin/dining")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminDiningController : ControllerBase
{
    private readonly IDiningService _dining;

    public AdminDiningController(IDiningService dining) => _dining = dining;

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

    /// <summary>GET /api/admin/dining/venues — includes retired venues.</summary>
    [HttpGet("venues")]
    public async Task<IActionResult> GetVenues()
        => FromResult(await _dining.GetVenuesForAdminAsync());

    /// <summary>
    /// PUT /api/admin/dining/venues/{slug}
    /// Upsert. The slug in the route wins, so one venue's form cannot
    /// overwrite another.
    /// </summary>
    [HttpPut("venues/{slug}")]
    public async Task<IActionResult> SaveVenue(string slug, [FromBody] SaveDiningVenueDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        request.Id = slug;
        return FromMessage(await _dining.SaveVenueAsync(request));
    }

    /// <summary>POST /api/admin/dining/venues — create.</summary>
    [HttpPost("venues")]
    public async Task<IActionResult> CreateVenue([FromBody] SaveDiningVenueDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _dining.SaveVenueAsync(request));
    }

    /// <summary>DELETE /api/admin/dining/venues/{slug} — soft retire.</summary>
    [HttpDelete("venues/{slug}")]
    public async Task<IActionResult> DeleteVenue(string slug)
        => FromMessage(await _dining.DeleteVenueAsync(slug));

    /// <summary>
    /// GET /api/admin/dining/reservations?venue=&amp;from=&amp;to=&amp;status=&amp;search=
    /// Defaults to today's covers.
    /// </summary>
    [HttpGet("reservations")]
    public async Task<IActionResult> GetReservations([FromQuery] DiningBookingSearchDto filter)
        => FromResult(await _dining.GetReservationsForAdminAsync(filter));

    /// <summary>
    /// PUT /api/admin/dining/reservations/{referenceId}/status
    /// Confirmed → Seated → Completed, or Cancelled / No-Show.
    /// </summary>
    [HttpPut("reservations/{referenceId}/status")]
    public async Task<IActionResult> SetStatus(string referenceId,
                                               [FromBody] UpdateDiningStatusDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _dining.SetReservationStatusAsync(referenceId, request));
    }

    /// <summary>
    /// PUT /api/admin/dining/venues/{slug}/menu
    ///
    /// Replaces the whole menu. A menu is the thing in a restaurant that
    /// changes most often, and until now it could only be edited with a SQL
    /// script.
    /// </summary>
    [HttpPut("venues/{slug}/menu")]
    public async Task<IActionResult> SaveMenu(string slug, [FromBody] SaveDiningMenuDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _dining.SaveMenuAsync(slug, request));
    }
}