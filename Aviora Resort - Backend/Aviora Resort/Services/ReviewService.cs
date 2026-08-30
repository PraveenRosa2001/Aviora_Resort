using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;
using AvioraResort.Repositories;

namespace AvioraResort.Services;

/// <summary>
/// Business rules for guest reviews.
///
/// The identity of a reviewer is taken from the JWT, never from the request
/// body. The old form let a guest type any display name, which meant one
/// account could post as anyone.
/// </summary>
public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviews;
    private readonly IUserRepository _users;

    public ReviewService(IReviewRepository reviews, IUserRepository users)
    {
        _reviews = reviews;
        _users = users;
    }

    public async Task<ServiceResult<List<ReviewDto>>> GetForVillaAsync(string villaCode, int? currentUserId)
    {
        if (string.IsNullOrWhiteSpace(villaCode))
            return ServiceResult<List<ReviewDto>>.Fail("A villa identifier is required.", 400);

        var reviews = await _reviews.GetByVillaAsync(villaCode.Trim(), currentUserId);
        return ServiceResult<List<ReviewDto>>.Ok(reviews.Select(ToDto).ToList());
    }

    public async Task<ServiceResult<ReviewDto>> CreateAsync(string villaCode, int userId,
                                                            CreateReviewRequestDto request)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            return ServiceResult<ReviewDto>.Fail("Your session is no longer valid. Please sign in again.", 401);

        // Display name and origin come from the account, not the form.
        var guestName = $"{user.FirstName} {user.LastName}".Trim();
        var guestOrigin = string.IsNullOrWhiteSpace(request.GuestOrigin)
                            ? (user.Country ?? "Resort Guest")
                            : request.GuestOrigin.Trim();

        var reviewCode = $"rev-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var stayDate = DateTime.UtcNow.ToString("MMMM yyyy");

        var status = await _reviews.CreateAsync(
            reviewCode, villaCode.Trim(), userId,
            guestName, guestOrigin, request.Rating,
            string.IsNullOrWhiteSpace(request.Headline)
                ? "Unforgettable Luxury Retreat"
                : request.Headline.Trim(),
            request.Comment.Trim(), stayDate);

        return status switch
        {
            -1 => ServiceResult<ReviewDto>.Fail("This villa is no longer available.", 404),
            -2 => ServiceResult<ReviewDto>.Fail(
                      "You have already shared a review for this villa. Thank you.", 409),
            1 => await ReturnFreshReview(villaCode, userId, reviewCode),
            _ => ServiceResult<ReviewDto>.Fail("Your review could not be saved. Please try again.", 500)
        };
    }

    /// <summary>
    /// Re-reads the villa's reviews so the response carries the row exactly as
    /// stored, including the server-generated code and date.
    /// </summary>
    private async Task<ServiceResult<ReviewDto>> ReturnFreshReview(string villaCode, int userId, string reviewCode)
    {
        var reviews = await _reviews.GetByVillaAsync(villaCode.Trim(), userId);
        var created = reviews.FirstOrDefault(r => r.ReviewCode == reviewCode);

        return created is null
            ? ServiceResult<ReviewDto>.Fail("Your review was saved but could not be reloaded.", 500)
            : ServiceResult<ReviewDto>.Ok(ToDto(created));
    }

    public async Task<ServiceResult<int>> MarkHelpfulAsync(string reviewCode, int userId)
    {
        if (string.IsNullOrWhiteSpace(reviewCode))
            return ServiceResult<int>.Fail("A review identifier is required.", 400);

        var (status, helpfulCount) = await _reviews.MarkHelpfulAsync(reviewCode.Trim(), userId);

        // status 0 means this guest had already voted. That is not an error -
        // the endpoint is idempotent, so return the current count either way.
        return status == -1
            ? ServiceResult<int>.Fail("That review no longer exists.", 404)
            : ServiceResult<int>.Ok(helpfulCount);
    }

    public async Task<ServiceResult<string>> DeleteAsync(string reviewCode)
    {
        var status = await _reviews.DeleteAsync(reviewCode.Trim());

        return status == 1
            ? ServiceResult<string>.Ok("Review removed and the villa rating recalculated.")
            : ServiceResult<string>.Fail("That review no longer exists.", 404);
    }

    private static ReviewDto ToDto(VillaReview r) => new()
    {
        Id = r.ReviewCode,
        VillaId = r.VillaCode,
        VillaName = r.VillaName,
        GuestName = r.GuestName,
        GuestOrigin = r.GuestOrigin,
        Rating = r.Rating,
        Headline = r.Headline,
        Comment = r.Comment,
        StayDate = r.StayDate,
        HelpfulCount = r.HelpfulCount,
        IsVerified = r.IsVerified,
        HasVoted = r.HasVoted,
        IsMine = r.IsMine
    };
}