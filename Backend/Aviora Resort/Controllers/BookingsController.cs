using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Guest-facing reservations.
///
/// The quote endpoint is anonymous - a guest prices a stay before deciding to
/// sign in. Creating, listing and cancelling require an account, so every
/// reservation is attributable and "my bookings" means something.
/// </summary>
[ApiController]
[Route("api/bookings")]
[Produces("application/json")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookings;

    public BookingsController(IBookingService bookings) => _bookings = bookings;

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
    /// POST /api/bookings/quote
    ///
    /// Prices a stay. Anonymous, and always 200 when the villa exists - a stay
    /// that cannot be booked returns priced = false with a reason code, because
    /// "sold out" is an answer rather than a failure.
    ///
    /// This is what replaces the arithmetic in BookingCheckoutModal.jsx.
    /// </summary>
    [HttpPost("quote")]
    [AllowAnonymous]
    public async Task<IActionResult> Quote([FromBody] QuoteRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromResult(await _bookings.GetQuoteAsync(request));
    }

    /// <summary>
    /// POST /api/bookings
    ///
    /// The request carries no money fields. The server re-prices the stay from
    /// the dates, villa, plan, add-ons and promo code, so an edited total in
    /// the browser changes nothing.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequestDto request)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Please sign in to complete your reservation."));

        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _bookings.CreateAsync(CurrentUserId.Value, request);

        return result.Success
            ? CreatedAtAction(nameof(GetByReference),
                              new { referenceId = result.Data!.ReferenceId }, result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>GET /api/bookings/my</summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> MyBookings([FromQuery] bool includeCancelled = true)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        return FromResult(await _bookings.GetMyBookingsAsync(CurrentUserId.Value, includeCancelled));
    }

    /// <summary>
    /// GET /api/bookings/{referenceId}
    ///
    /// Scoped to the signed-in guest unless they are an administrator, so
    /// guessing another reference returns the same 404 as a made-up one.
    /// </summary>
    [HttpGet("{referenceId}")]
    [Authorize]
    public async Task<IActionResult> GetByReference(string referenceId)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        var isAdmin = User.IsInRole("admin");
        return FromResult(await _bookings.GetByReferenceAsync(referenceId, CurrentUserId.Value, isAdmin));
    }

    /// <summary>
    /// POST /api/bookings/{referenceId}/cancel
    ///
    /// Refuses a non-refundable rate or a stay past its cancellation deadline -
    /// both were fixed onto the booking when it was made, so editing the rate
    /// plan afterwards does not change what this guest agreed to.
    /// </summary>
    [HttpPost("{referenceId}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(string referenceId,
                                            [FromBody] CancelBookingRequestDto? request)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        var result = await _bookings.CancelAsync(
            referenceId, CurrentUserId.Value, isAdmin: false, request?.Reason);

        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}