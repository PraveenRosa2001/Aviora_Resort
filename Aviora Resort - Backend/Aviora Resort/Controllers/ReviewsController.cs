using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Services;

namespace AvioraResort.Controllers;

/// <summary>
/// Guest reviews.
///
/// Reading is anonymous - anyone browsing the villa collection sees the reviews.
/// Writing requires a signed-in account, so every review is attributable and a
/// guest can only post once per villa.
///
/// There is no endpoint here for editing a villa. That lives on
/// AdminVillasController behind [Authorize(Roles = "admin")].
/// </summary>
[ApiController]
[Route("api/villas/{villaCode}/reviews")]
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;

    public ReviewsController(IReviewService reviews) => _reviews = reviews;

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
    /// GET /api/villas/canopy-villa-01/reviews
    /// Anonymous. When a token is present, each review is flagged with
    /// hasVoted and isMine so the UI can disable the right buttons.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(string villaCode)
        => FromResult(await _reviews.GetForVillaAsync(villaCode, CurrentUserId));

    /// <summary>
    /// POST /api/villas/canopy-villa-01/reviews
    /// Signed-in guests only. The display name is taken from the account, not
    /// from the request body.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateReview(string villaCode,
                                                  [FromBody] CreateReviewRequestDto request)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Please sign in to share a review."));

        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponseDto(FirstValidationError()));

        return FromResult(await _reviews.CreateAsync(villaCode, CurrentUserId.Value, request));
    }

    /// <summary>
    /// POST /api/villas/{villaCode}/reviews/{reviewCode}/helpful
    /// One vote per guest per review, enforced by dbo.ReviewHelpfulVotes.
    /// Idempotent: voting twice returns the current count without changing it.
    /// </summary>
    [HttpPost("{reviewCode}/helpful")]
    [Authorize]
    public async Task<IActionResult> MarkHelpful(string villaCode, string reviewCode)
    {
        if (CurrentUserId is null)
            return Unauthorized(new ErrorResponseDto("Please sign in first."));

        var result = await _reviews.MarkHelpfulAsync(reviewCode, CurrentUserId.Value);

        return result.Success
            ? Ok(new { helpfulCount = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }

    /// <summary>
    /// DELETE /api/villas/{villaCode}/reviews/{reviewCode}
    /// Moderation only. The villa rating is recalculated afterwards.
    /// </summary>
    [HttpDelete("{reviewCode}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteReview(string villaCode, string reviewCode)
    {
        var result = await _reviews.DeleteAsync(reviewCode);

        return result.Success
            ? Ok(new { message = result.Data })
            : StatusCode(result.StatusCode, new ErrorResponseDto(result.Error));
    }
}