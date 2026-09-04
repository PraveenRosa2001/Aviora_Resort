using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IReviewService
{
    Task<ServiceResult<List<ReviewDto>>> GetForVillaAsync(string villaCode, int? currentUserId);

    Task<ServiceResult<ReviewDto>> CreateAsync(string villaCode, int userId,
                                               CreateReviewRequestDto request);

    Task<ServiceResult<int>> MarkHelpfulAsync(string reviewCode, int userId);

    Task<ServiceResult<string>> DeleteAsync(string reviewCode);
}