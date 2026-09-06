using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Dining venues and table reservations.
///
/// Reading venues and checking a sitting are anonymous - a visitor browses the
/// restaurants long before signing in. Booking a table requires an account, so
/// the reservation is attributable and appears under "my reservations".
/// </summary>
[ApiController]
[Route("api/dining")]
[Produces("application/json")]
public class DiningController : ControllerBase
{
    private readonly IDiningService _dining;

    public DiningController(IDiningService dining) => _dining = dining;

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private string FirstValidationError() =>
        ModelState.Values.SelectMany(v => v.Errors)
                         .Select(e => e.ErrorMessage)
                         .FirstOrDefault() ?? "Invalid request.";

    /// <summary>
    /// GET /api/dining/venues?type=restaurant
    /// Every venue with its gallery, sourcing notes and menu.
    /// </summary>
    [HttpGet("venues")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVenues([FromQuery] string? type)
        => FromResult(await _dining.GetVenuesAsync(type));

    /// <summary>GET /api/dining/venues/{slug}</summary>
    [HttpGet("venues/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVenue(string slug)
        => FromResult(await _dining.GetVenueAsync(slug));

    /// <summary>
    /// GET /api/dining/venues/{slug}/availability?date=&amp;time=19:30&amp;partySize=4
    ///
    /// Always 200 when the venue exists. A full sitting comes back as
    /// available = false with a reason - that is an answer, not a failure.
    /// </summary>
    [HttpGet("venues/{slug}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability(string slug,
                                                     [FromQuery] DiningAvailabilityRequestDto request)
        => FromResult(await _dining.GetAvailabilityAsync(slug, request));

    /// <summary>
    /// POST /api/dining/reservations
    ///
    /// The capacity check runs under a range lock, so two parties going for
    /// the last covers at the same sitting cannot both succeed.
    /// </summary>
    [HttpPost("reservations")]
    [Authorize]
    public async Task<IActionResult> CreateReservation([FromBody] CreateDiningReservationDto request)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Please sign in to reserve a table."));

        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _dining.CreateReservationAsync(CurrentUserId.Value, request);

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>GET /api/dining/reservations/my</summary>
    [HttpGet("reservations/my")]
    [Authorize]
    public async Task<IActionResult> MyReservations()
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        return FromResult(await _dining.GetMyReservationsAsync(CurrentUserId.Value));
    }

    /// <summary>
    /// POST /api/dining/reservations/{referenceId}/cancel
    /// Scoped to the signed-in guest, so guessing another reference returns
    /// the same 404 as a made-up one.
    /// </summary>
    [HttpPost("reservations/{referenceId}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelReservation(string referenceId)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        var result = await _dining.CancelReservationAsync(
            referenceId, CurrentUserId.Value, isAdmin: false);

        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}