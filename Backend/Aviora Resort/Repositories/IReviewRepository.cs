using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IReviewRepository
{
    Task<List<VillaReview>> GetByVillaAsync(string villaCode, int? currentUserId);

    /// <summary>Status: 1 created, -1 villa not found, -2 already reviewed.</summary>
    Task<int> CreateAsync(string reviewCode, string villaCode, int userId,
                          string guestName, string? guestOrigin, int rating,
                          string? headline, string comment, string stayDate);

    /// <summary>Status: 1 counted, 0 already voted, -1 review not found.</summary>
    Task<(int Status, int HelpfulCount)> MarkHelpfulAsync(string reviewCode, int userId);

    /// <summary>Admin moderation. Status: 1 deleted, -1 not found.</summary>
    Task<int> DeleteAsync(string reviewCode);
}