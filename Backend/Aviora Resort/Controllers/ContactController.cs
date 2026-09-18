using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// The contact form.
///
/// Anonymous, because requiring an account to ask a question would lose the
/// enquiries that matter most — the ones from people deciding whether to book
/// at all. A signed-in guest is recognised anyway and their inquiries appear
/// under their account.
/// </summary>
[ApiController]
[Route("api/contact")]
[AllowAnonymous]
[Produces("application/json")]
public class ContactController : ControllerBase
{
    private readonly IInquiryService _inquiries;

    public ContactController(IInquiryService inquiries) => _inquiries = inquiries;

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

    private string FirstValidationError() =>
        ModelState.Values.SelectMany(v => v.Errors)
                         .Select(e => e.ErrorMessage)
                         .FirstOrDefault() ?? "Invalid request.";

    /// <summary>
    /// POST /api/contact
    ///
    /// The inquiry is committed to SQL before this returns. Nothing is
    /// emailed, so nothing can be lost by a mail server — the reference in the
    /// response is the acknowledgement.
    ///
    /// Rate limited: an open endpoint that writes a row on every call is a
    /// flooding target, and the desk's own screen is what would fill up.
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Create([FromBody] CreateInquiryDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _inquiries.CreateAsync(request, CurrentUserId);

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>
    /// GET /api/contact/{referenceId}?email=...
    ///
    /// Reference AND email must match. The reference alone is guessable —
    /// AVQ-3001, AVQ-3002 — and the messages hold names, telephone numbers and
    /// travel plans.
    /// </summary>
    [HttpGet("{referenceId}")]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Lookup(string referenceId, [FromQuery] InquiryLookupDto query)
    {
        var result = await _inquiries.LookupAsync(referenceId, query.Email);

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>GET /api/contact/my — a signed-in guest's own inquiries.</summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> MyInquiries()
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Invalid session."));

        var result = await _inquiries.GetMyInquiriesAsync(CurrentUserId.Value);

        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}