using AvioraResort.Models.DTOs;
using AvioraResort.Models.Entities;

namespace AvioraResort.Repositories;

public interface IInquiryRepository
{
    /// <summary>Commits the inquiry and returns its reference. Nothing else happens first.</summary>
    Task<(int Status, string? ReferenceId, DateTime CreatedAt)> CreateAsync(
        CreateInquiryDto request, int? userId);

    /// <summary>Reference AND email must match — the reference alone is guessable.</summary>
    Task<ContactInquiry?> GetByReferenceForGuestAsync(string referenceId, string email);

    Task<List<ContactInquiry>> GetByUserAsync(int userId);

    Task<List<ContactInquiry>> SearchAsync(InquirySearchDto filter);
    Task<ContactInquiry?> GetDetailAsync(string referenceId);
    Task<InquiryCounts> GetCountsAsync();

    Task<int> MarkReadAsync(string referenceId, bool isRead);
    Task<int> SetStatusAsync(string referenceId, UpdateInquiryDto request);
    /// <summary>
    /// Status 1 added, -1 not found. The rest is everything the email needs,
    /// returned in the same round trip so the service does not go back for it.
    /// </summary>
    Task<(int Status, int ReplyId, string? Email, string? FirstName, string? LastName,
          string? Subject, string? OriginalMessage, DateTime OriginalSentAt)>
        AddReplyAsync(string referenceId, int? authorUserId, AddInquiryReplyDto request);

    /// <summary>Stamps the outcome of the SMTP attempt onto the reply.</summary>
    Task<int> SetDeliveryAsync(int replyId, string status, string? error);
}