using AvioraResort.Models.Common;
using AvioraResort.Models.DTOs;

namespace AvioraResort.Services;

public interface IInquiryService
{
    /* ---------- guest ---------- */
    Task<ServiceResult<InquiryCreatedDto>> CreateAsync(CreateInquiryDto request, int? userId);
    Task<ServiceResult<InquiryDto>> LookupAsync(string referenceId, string? email);
    Task<ServiceResult<List<InquiryDto>>> GetMyInquiriesAsync(int userId);

    /* ---------- desk ---------- */
    Task<ServiceResult<List<InquiryDto>>> SearchAsync(InquirySearchDto filter);
    Task<ServiceResult<InquiryDto>> GetDetailAsync(string referenceId);
    Task<ServiceResult<InquiryCountsDto>> GetCountsAsync();
    Task<ServiceResult<string>> MarkReadAsync(string referenceId, MarkReadDto request);
    Task<ServiceResult<string>> UpdateAsync(string referenceId, UpdateInquiryDto request);
    /// <summary>
    /// Records the reply, then sends it. <paramref name="authorName"/> signs
    /// the email, so it reads as a person rather than "Admin".
    /// </summary>
    Task<ServiceResult<ReplyResultDto>> AddReplyAsync(
        string referenceId, int? authorUserId, string authorName, AddInquiryReplyDto request);
}