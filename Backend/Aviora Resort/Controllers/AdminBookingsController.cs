using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// The reservations desk.
///
/// [Authorize(Roles = "admin")] on the class. These routes read every guest's
/// personal details and can cancel a paid reservation, so a guest reaching any
/// of them would be a serious breach - which is why the boundary is here and
/// not in React.
/// </summary>
[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminBookingsController : ControllerBase
{
    private readonly IBookingService _bookings;

    public AdminBookingsController(IBookingService bookings) => _bookings = bookings;

    private int AdminUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : 0;

    private IActionResult FromResult<T>(ServiceResult<T> result) =>
        result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    private IActionResult FromMessage(ServiceResult<string> result) =>
        result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));

    /// <summary>
    /// GET /api/admin/bookings?search=&amp;status=&amp;from=&amp;to=&amp;page=&amp;pageSize=
    /// Search matches the reference, guest name, email or villa name.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] BookingSearchDto filter)
        => FromResult(await _bookings.SearchAsync(filter));

    /// <summary>GET /api/admin/bookings/{referenceId} — the full voucher.</summary>
    [HttpGet("{referenceId}")]
    public async Task<IActionResult> GetByReference(string referenceId)
        => FromResult(await _bookings.GetByReferenceAsync(referenceId, null, isAdmin: true));

    /// <summary>
    /// PUT /api/admin/bookings/{referenceId}/status
    ///
    /// Confirmed → Checked-In → Checked-Out, or Cancelled / No-Show. Setting
    /// Cancelled here runs the same procedure a guest cancellation does, so the
    /// inventory is released either way and a desk cancellation cannot leave
    /// nights locked.
    /// </summary>
    [HttpPut("{referenceId}/status")]
    public async Task<IActionResult> SetStatus(string referenceId,
                                               [FromBody] UpdateBookingStatusDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(
                ModelState.Values.SelectMany(v => v.Errors)
                                 .Select(e => e.ErrorMessage)
                                 .FirstOrDefault() ?? "Invalid request."));

        return FromMessage(await _bookings.SetStatusAsync(referenceId, request, AdminUserId));
    }

    /// <summary>
    /// GET /api/admin/bookings/dashboard/kpis
    /// Revenue, occupancy, and today's arrivals and departures for the desk.
    /// </summary>
    [HttpGet("dashboard/kpis")]
    public async Task<IActionResult> Kpis()
        => FromResult(await _bookings.GetKpisAsync());
}