using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// The concierge desk.
///
/// [Authorize(Roles = "admin")] on the class. These routes read guests'
/// telephone numbers, travel plans and the desk's own internal notes, so the
/// boundary is here rather than in React.
/// </summary>
[ApiController]
[Route("api/admin/inquiries")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class AdminInquiriesController : ControllerBase
{
    private readonly IInquiryService _inquiries;

    public AdminInquiriesController(IInquiryService inquiries) => _inquiries = inquiries;

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue("uid"), out var id) ? id : null;

    /// <summary>
    /// Signs the outbound email. AuthService already puts ClaimTypes.Name on
    /// the token as "FirstName LastName", so the guest sees a person.
    /// </summary>
    private string CurrentUserName =>
        User.FindFirstValue(ClaimTypes.Name) ?? "The Concierge";

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

    /// <summary>
    /// GET /api/admin/inquiries?status=&amp;unreadOnly=&amp;priority=&amp;search=&amp;from=&amp;to=
    /// Defaults to everything still needing attention.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] InquirySearchDto filter)
        => FromResult(await _inquiries.SearchAsync(filter));

    /// <summary>
    /// GET /api/admin/inquiries/counts
    /// Drives the console badge — the notification an email would have been.
    /// </summary>
    [HttpGet("counts")]
    public async Task<IActionResult> Counts()
        => FromResult(await _inquiries.GetCountsAsync());

    /// <summary>GET /api/admin/inquiries/{referenceId} — the thread, internal notes included.</summary>
    [HttpGet("{referenceId}")]
    public async Task<IActionResult> Detail(string referenceId)
        => FromResult(await _inquiries.GetDetailAsync(referenceId));

    /// <summary>PUT /api/admin/inquiries/{referenceId}/read</summary>
    [HttpPut("{referenceId}/read")]
    public async Task<IActionResult> MarkRead(string referenceId, [FromBody] MarkReadDto request)
        => FromMessage(await _inquiries.MarkReadAsync(referenceId, request));

    /// <summary>
    /// PUT /api/admin/inquiries/{referenceId}
    /// Status, priority and assignment in one call — the desk changes them together.
    /// </summary>
    [HttpPut("{referenceId}")]
    public async Task<IActionResult> Update(string referenceId, [FromBody] UpdateInquiryDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromMessage(await _inquiries.UpdateAsync(referenceId, request));
    }

    /// <summary>
    /// POST /api/admin/inquiries/{referenceId}/replies
    ///
    /// Records what was said, and to whom. The message itself goes out through
    /// the desk's own mail client — this is the record of it, which is the part
    /// a shared mailbox was providing.
    /// </summary>
    [HttpPost("{referenceId}/replies")]
    public async Task<IActionResult> AddReply(string referenceId,
                                              [FromBody] AddInquiryReplyDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        var result = await _inquiries.AddReplyAsync(
            referenceId, CurrentUserId, CurrentUserName, request);

        // 200 even when the send failed. The reply WAS recorded, and the body
        // says so - a 500 here would suggest nothing happened and the desk
        // would send it a second time.
        return result.Success
            ? Ok(result.Data)
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}